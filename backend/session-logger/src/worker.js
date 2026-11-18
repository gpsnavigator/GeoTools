/**
 * GeoTools session logger -- a Cloudflare Worker.
 *
 * POST /         body: a SessionLog JSON document (sent as text/plain by the frontend, see
 *                frontend/src/services/sessionLog.ts). The Worker adds the caller's IP address (as Cloudflare saw it),
 *                its country and the receive time, and commits the document to the GitHub repository as
 *                `sessions/<yyyy>/<mm>/<dd>/<sessionId>.json` on the GITHUB_BRANCH branch. A later snapshot of the same
 *                session overwrites the file (each snapshot is a commit, so the history keeps every revision).
 * GET  /health   liveness check.
 *
 * Env: GITHUB_REPO ("owner/name"), GITHUB_BRANCH, ALLOWED_ORIGINS (comma-separated), GITHUB_TOKEN (secret).
 */

const MAX_BODY_BYTES = 512 * 1024;
const SESSION_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;
const GITHUB_API = 'https://api.github.com';

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean);
  const headers = {
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (allowed.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

function isOriginAllowed(request, env) {
  const origin = request.headers.get('Origin');
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean);
  return origin !== null && allowed.includes(origin);
}

/** UTF-8 safe base64 for the GitHub contents API. */
function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function githubHeaders(env) {
  return {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'geotools-session-logger',
  };
}

async function getFileSha(env, path) {
  const url = `${GITHUB_API}/repos/${env.GITHUB_REPO}/contents/${path}?ref=${encodeURIComponent(env.GITHUB_BRANCH)}`;
  const response = await fetch(url, { headers: githubHeaders(env) });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`GitHub GET ${response.status}: ${(await response.text()).slice(0, 200)}`);
  }
  const body = await response.json();
  return body.sha || null;
}

/** Creates or overwrites one file on the branch; retries once when a concurrent snapshot changed its sha. */
async function putFile(env, path, content, message) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const sha = await getFileSha(env, path);
    const response = await fetch(`${GITHUB_API}/repos/${env.GITHUB_REPO}/contents/${path}`, {
      method: 'PUT',
      headers: { ...githubHeaders(env), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        content: toBase64(content),
        branch: env.GITHUB_BRANCH,
        ...(sha ? { sha } : {}),
      }),
    });
    if (response.ok) {
      return;
    }
    // 409 / 422: the file changed (or appeared) between our GET and PUT -- read the new sha and try again.
    if ((response.status === 409 || response.status === 422) && attempt < 2) {
      continue;
    }
    throw new Error(`GitHub PUT ${response.status}: ${(await response.text()).slice(0, 200)}`);
  }
}

async function handleLog(request, env, cors) {
  if (!isOriginAllowed(request, env)) {
    return json({ error: 'origin not allowed' }, 403, cors);
  }
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO || !env.GITHUB_BRANCH) {
    return json({ error: 'logger not configured' }, 500, cors);
  }

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    return json({ error: 'payload too large' }, 413, cors);
  }

  let session;
  try {
    session = JSON.parse(text);
  } catch {
    return json({ error: 'invalid JSON' }, 400, cors);
  }
  if (!session || typeof session !== 'object' || Array.isArray(session)) {
    return json({ error: 'expected an object' }, 400, cors);
  }
  if (typeof session.sessionId !== 'string' || !SESSION_ID_PATTERN.test(session.sessionId)) {
    return json({ error: 'invalid sessionId' }, 400, cors);
  }
  const started = new Date(typeof session.startedAt === 'string' ? session.startedAt : Date.now());
  const day = Number.isNaN(started.getTime()) ? new Date() : started;

  const receivedAt = new Date().toISOString();
  const stored = {
    ...session,
    server: {
      ipAddress: request.headers.get('CF-Connecting-IP'),
      country: request.cf?.country ?? null,
      city: request.cf?.city ?? null,
      receivedAt,
    },
  };

  const yyyy = day.getUTCFullYear();
  const mm = String(day.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(day.getUTCDate()).padStart(2, '0');
  const path = `sessions/${yyyy}/${mm}/${dd}/${session.sessionId}.json`;
  const revision = Number.isFinite(session.revision) ? session.revision : '?';

  try {
    await putFile(env, path, `${JSON.stringify(stored, null, 2)}\n`, `Session ${session.sessionId} r${revision}`);
  } catch (error) {
    return json({ error: String(error && error.message ? error.message : error) }, 502, cors);
  }

  return json({ ok: true, path, receivedAt }, 200, cors);
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method === 'GET' && url.pathname === '/health') {
      return json({ ok: true }, 200, cors);
    }
    if (request.method === 'POST' && (url.pathname === '/' || url.pathname === '/sessions')) {
      return handleLog(request, env, cors);
    }
    return json({ error: 'not found' }, 404, cors);
  },
};
