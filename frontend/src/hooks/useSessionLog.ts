import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SESSION_LOG_ENDPOINT,
  beaconSessionToServer,
  createSessionLog,
  lookupClientIp,
  saveSessionLocally,
  sendSessionToServer,
  type LoggedGpxFile,
  type LoggedPhoto,
  type SessionEndReason,
  type SessionLog,
  type SessionLogStatus,
} from '../services/sessionLog';

/** Changes within this window are saved as one snapshot. */
const SAVE_DEBOUNCE_MS = 1500;

export interface SessionLogAdditions {
  photos?: Omit<LoggedPhoto, 'addedAt'>[];
  gpxFiles?: Omit<LoggedGpxFile, 'addedAt'>[];
  warnings?: string[];
}

export interface UseSessionLogResult {
  status: SessionLogStatus;
  sessionId: string | null;
  /** Appends what the user just loaded to the current session (starting one if needed) and schedules a save. */
  record: (additions: SessionLogAdditions) => void;
  /** Closes the current session (saved right away); the next `record` starts a new one. */
  end: (reason: SessionEndReason) => void;
}

/**
 * Logs one tool page's work as sessions (see services/sessionLog.ts). A session starts with the first loaded file,
 * so merely opening the page logs nothing, and ends on `end('clear')` or when the page is left or reloaded.
 */
export function useSessionLog(tool: string): UseSessionLogResult {
  const sessionRef = useRef<SessionLog | null>(null);
  const timerRef = useRef<number | null>(null);
  const dirtyRef = useRef(false);
  const [status, setStatus] = useState<SessionLogStatus>({ state: 'idle' });
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Start the IP lookup early, so it is usually done by the time the first file is dropped.
  useEffect(() => {
    void lookupClientIp();
  }, []);

  const save = useCallback(async (session: SessionLog) => {
    dirtyRef.current = false;
    const snapshot: SessionLog = { ...session, revision: session.revision + 1, updatedAt: new Date().toISOString() };
    session.revision = snapshot.revision;
    session.updatedAt = snapshot.updatedAt;
    saveSessionLocally(snapshot);

    if (!SESSION_LOG_ENDPOINT) {
      setStatus({ state: 'saved', target: 'local', at: snapshot.updatedAt });
      return;
    }

    setStatus({ state: 'saving' });
    try {
      await sendSessionToServer(snapshot);
      setStatus({ state: 'saved', target: 'server', at: new Date().toISOString() });
    } catch (error) {
      setStatus({ state: 'error', message: error instanceof Error ? error.message : String(error), at: new Date().toISOString() });
    }
  }, []);

  const cancelTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleSave = useCallback(() => {
    dirtyRef.current = true;
    cancelTimer();
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      const session = sessionRef.current;
      if (session) {
        void save(session);
      }
    }, SAVE_DEBOUNCE_MS);
  }, [cancelTimer, save]);

  const record = useCallback((additions: SessionLogAdditions) => {
    const addedAt = new Date().toISOString();
    const photos = additions.photos ?? [];
    const gpxFiles = additions.gpxFiles ?? [];
    const warnings = additions.warnings ?? [];
    if (photos.length === 0 && gpxFiles.length === 0 && warnings.length === 0) {
      return;
    }

    if (!sessionRef.current) {
      sessionRef.current = createSessionLog(tool, null);
      setSessionId(sessionRef.current.sessionId);
    }
    const session = sessionRef.current;
    session.photos.push(...photos.map((photo) => ({ ...photo, addedAt })));
    session.gpxFiles.push(...gpxFiles.map((file) => ({ ...file, addedAt })));
    session.warnings.push(...warnings.map((message) => ({ message, addedAt })));

    void lookupClientIp().then((ip) => {
      if (ip && !session.clientReportedIp) {
        session.clientReportedIp = ip;
      }
      scheduleSave();
    });
  }, [scheduleSave, tool]);

  const end = useCallback((reason: SessionEndReason) => {
    const session = sessionRef.current;
    cancelTimer();
    if (!session) {
      return;
    }
    sessionRef.current = null;
    setSessionId(null);
    session.endedAt = new Date().toISOString();
    session.endReason = reason;
    void save(session);
  }, [cancelTimer, save]);

  // Leaving or reloading the page ends the session. A normal fetch may be cancelled while the page unloads, so the
  // final snapshot goes out as a beacon (the local copy is written synchronously first).
  useEffect(() => {
    const handlePageHide = () => {
      const session = sessionRef.current;
      if (!session) {
        return;
      }
      cancelTimer();
      session.endedAt = new Date().toISOString();
      session.endReason = 'unload';
      session.revision += 1;
      session.updatedAt = session.endedAt;
      saveSessionLocally(session);
      if (!beaconSessionToServer(session) && dirtyRef.current && SESSION_LOG_ENDPOINT) {
        void sendSessionToServer(session).catch(() => undefined);
      }
      sessionRef.current = null;
    };

    window.addEventListener('pagehide', handlePageHide);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [cancelTimer]);

  // Navigating to another page of the app (component unmount) ends the session too.
  useEffect(() => () => {
    const session = sessionRef.current;
    if (!session) {
      return;
    }
    cancelTimer();
    sessionRef.current = null;
    session.endedAt = new Date().toISOString();
    session.endReason = 'unload';
    session.revision += 1;
    session.updatedAt = session.endedAt;
    saveSessionLocally(session);
    if (SESSION_LOG_ENDPOINT) {
      void sendSessionToServer(session).catch(() => undefined);
    }
  }, [cancelTimer]);

  return { status, sessionId, record, end };
}
