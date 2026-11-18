/**
 * Session logging -- the "can a GitHub Pages site store dynamic data?" experiment.
 *
 * A session is all the work done on a tool page until the user clears it or leaves/reloads the page. Its log is a
 * JSON document (see `SessionLog`) that holds metadata only -- file names, coordinates, waypoint details -- never
 * file contents. Every change is saved:
 *
 *  - to `localStorage` (always; the last MAX_LOCAL_SESSIONS sessions), and
 *  - to the session-logger backend (`VITE_SESSION_LOG_ENDPOINT`, a Cloudflare Worker -- see backend/session-logger)
 *    when configured. The Worker adds the caller's IP address and commits the document as
 *    `sessions/<yyyy>/<mm>/<dd>/<sessionId>.json` to the repository's `data` branch, overwriting the previous
 *    snapshot of the same session.
 *
 * GitHub Pages itself can only serve static files, so a server-side write always needs something outside Pages that
 * holds the write credentials; the Worker is the smallest such piece.
 */

export const SESSION_LOG_ENDPOINT = (import.meta.env.VITE_SESSION_LOG_ENDPOINT ?? '').trim();

const LOCAL_STORAGE_KEY = 'geotools_session_logs';
const MAX_LOCAL_SESSIONS = 50;
/** Browsers cap keepalive/beacon bodies at 64 KiB in total; stay safely below. */
const KEEPALIVE_LIMIT = 60_000;
const IP_LOOKUP_URL = 'https://api.ipify.org?format=json';

export interface LoggedPhoto {
  fileName: string;
  fileSize: number;
  lat: number;
  lon: number;
  dateTime: string | null;
  camera: string | null;
  addedAt: string;
}

export interface LoggedWaypoint {
  name: string;
  lat: number;
  lon: number;
  dateTime: string | null;
  description: string;
}

export interface LoggedGpxFile {
  fileName: string;
  fileSize: number;
  waypointCount: number;
  waypoints: LoggedWaypoint[];
  addedAt: string;
}

export interface LoggedWarning {
  message: string;
  addedAt: string;
}

export type SessionEndReason = 'clear' | 'unload';

export interface SessionLog {
  schemaVersion: 1;
  sessionId: string;
  tool: string;
  startedAt: string;
  updatedAt: string;
  endedAt: string | null;
  endReason: SessionEndReason | null;
  /** Number of snapshots sent so far, including this one. */
  revision: number;
  /** As reported by a public IP lookup from the browser; the backend stores the address it saw as `ipAddress`. */
  clientReportedIp: string | null;
  pageUrl: string;
  userAgent: string;
  language: string;
  timeZone: string;
  photos: LoggedPhoto[];
  gpxFiles: LoggedGpxFile[];
  warnings: LoggedWarning[];
}

export type SaveTarget = 'server' | 'local';

export type SessionLogStatus =
  | { state: 'idle' }
  | { state: 'saving' }
  | { state: 'saved'; target: SaveTarget; at: string }
  | { state: 'error'; message: string; at: string };

function newSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function createSessionLog(tool: string, clientReportedIp: string | null): SessionLog {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    sessionId: newSessionId(),
    tool,
    startedAt: now,
    updatedAt: now,
    endedAt: null,
    endReason: null,
    revision: 0,
    clientReportedIp,
    pageUrl: window.location.href,
    userAgent: navigator.userAgent,
    language: navigator.language,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    photos: [],
    gpxFiles: [],
    warnings: [],
  };
}

let ipLookup: Promise<string | null> | null = null;

/** The browser's public IP address from a public lookup service, fetched once per page load (null if blocked). */
export function lookupClientIp(): Promise<string | null> {
  if (!ipLookup) {
    ipLookup = fetch(IP_LOOKUP_URL, { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: unknown) => {
        const ip = (body as { ip?: unknown } | null)?.ip;
        return typeof ip === 'string' ? ip : null;
      })
      .catch(() => null);
  }
  return ipLookup;
}

function readLocalSessions(): SessionLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as SessionLog[]) : [];
  } catch {
    return [];
  }
}

/** Inserts or replaces the session in the local copy, keeping only the newest MAX_LOCAL_SESSIONS sessions. */
export function saveSessionLocally(session: SessionLog): void {
  try {
    const others = readLocalSessions().filter((stored) => stored.sessionId !== session.sessionId);
    const next = [...others, session].slice(-MAX_LOCAL_SESSIONS);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or unavailable (private mode) -- the server copy, if any, still applies.
  }
}

/**
 * Sends one snapshot to the backend. The body is sent as text/plain so the browser doesn't need a CORS preflight
 * (the Worker parses it as JSON); `keepalive` lets the request finish while the page is closing.
 */
export async function sendSessionToServer(session: SessionLog): Promise<void> {
  const body = JSON.stringify(session);
  const response = await fetch(SESSION_LOG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body,
    // Browsers reject keepalive requests with bodies over 64 KiB, so only small snapshots get it.
    keepalive: body.length < KEEPALIVE_LIMIT,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}${text ? `: ${text.slice(0, 120)}` : ''}`);
  }
}

/** Fire-and-forget send for `pagehide`, when a normal fetch may be cancelled. Returns false if it couldn't queue. */
export function beaconSessionToServer(session: SessionLog): boolean {
  if (!SESSION_LOG_ENDPOINT || typeof navigator.sendBeacon !== 'function') {
    return false;
  }
  const body = JSON.stringify(session);
  if (body.length >= KEEPALIVE_LIMIT) {
    return false;
  }
  return navigator.sendBeacon(SESSION_LOG_ENDPOINT, new Blob([body], { type: 'text/plain;charset=UTF-8' }));
}
