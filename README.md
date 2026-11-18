# GeoTools

UI tools and calculators for geocaching and general work with coordinates and maps. A static React app hosted on
GitHub Pages: **https://gpsnavigator.github.io/GeoTools/**

Project rules for coding agents: [CLAUDE.md](CLAUDE.md) / [AGENTS.md](AGENTS.md).

## Tools

### GPX & Photos (`#/tools/gpx-photos`)

Drop (or choose) GPX files and JPG photos. GPX waypoints (`<wpt>`: name, description, time) and photos with EXIF GPS
coordinates (camera, DateTimeOriginal) are shown together:

- a list ordered by DateTime, with links to Mapy.com, OSM.cz, the iD editor and JOSM (remote control) for each item;
- a map with photo thumbnails and waypoint pins, OpenStreetMap or Mapy.com Outdoor base layer, full-screen toggle;
- click/hover in the list and on the map are synchronized; click a thumbnail for a full-size preview with prev/next;
- duplicates are skipped, unreadable / GPS-less / unsupported files are listed as import warnings; **Clear** resets.

Files are read in the browser only -- nothing is uploaded. Only the session log below leaves the browser.

## Session logging (storage experiment)

The app tests whether a GitHub Pages site can store dynamic data. **Pages itself can't**: it only serves static files,
and any write to GitHub needs a credential that must not be shipped in public JavaScript. So the write goes through the
smallest possible backend -- a Cloudflare Worker ([backend/session-logger](backend/session-logger)) that holds a
GitHub token and commits JSON files into this repository.

A *session* is all the work on a tool page until **Clear**, page reload/close, or navigating away. It starts with the
first loaded file. Its JSON document holds:

- session id, start / update / end time, end reason (`clear` / `unload`), revision, tool name;
- page URL, user agent, browser language, time zone;
- photos: file name, size, coordinates, DateTime, camera;
- GPX files: file name, size, and every waypoint (name, coordinates, time, description);
- import warnings;
- the IP address: `clientReportedIp` from the browser (via api.ipify.org) and `server.ipAddress` as seen by the
  Worker (Cloudflare's `CF-Connecting-IP`), plus `server.country`, `server.city` and `server.receivedAt`.

Each change is saved (debounced 1.5 s) to:

1. **`localStorage`** (`geotools_session_logs`, last 50 sessions) -- always; this is the fallback when no backend is
   configured or the request fails.
2. **The Worker**, when `VITE_SESSION_LOG_ENDPOINT` is set at build time. It writes
   `sessions/<yyyy>/<mm>/<dd>/<sessionId>.json` on the **`data` branch**; each snapshot of a session overwrites its
   file as a new commit (git history keeps every revision). The final snapshot on page unload is sent with
   `navigator.sendBeacon`. `data` is an orphan branch, so these commits never trigger a Pages rebuild.

The page shows a short notice that the session is logged and the save state ("saved on the server", "saved in this
browser only", or the error). Browse the stored logs at
https://github.com/gpsnavigator/GeoTools/tree/data/sessions.

## Project layout

```
frontend/                  React 19 + Vite + TypeScript + Tailwind v4 (HashRouter, i18next EN/CS, React-Leaflet, exifr)
  src/pages/tools/         tool pages (GpxPhotosPage.tsx)
  src/components/          layout (header/footer), map (base layers, expandable map), shared UI
  src/services/sessionLog.ts, src/hooks/useSessionLog.ts   session logging
  src/i18n/                en.ts (source of truth) + cs.ts
backend/session-logger/    Cloudflare Worker (src/worker.js, wrangler.toml)
.github/workflows/deploy.yml   build + deploy to GitHub Pages on push to main
```

## Local development

```bash
cd frontend
cp .env.example .env      # fill in VITE_MAPY_COM_API_KEY; leave VITE_SESSION_LOG_ENDPOINT empty or point it at the Worker
npm install
npm run dev               # http://localhost:5173/GeoTools/
npm run build             # type check + production build into frontend/dist
npm run lint
```

Without a Mapy.com key the Mapy.com layer shows no tiles; switch to OpenStreetMap in the layer control.

## Deploying to GitHub Pages

Pushing to `main` runs [.github/workflows/deploy.yml](.github/workflows/deploy.yml): `npm ci`, lint, build, and
publish `frontend/dist` to Pages. One-time setup in the GitHub web UI:

1. **Settings > Pages > Build and deployment > Source: GitHub Actions.**
2. **Settings > Secrets and variables > Actions > Secrets > New repository secret:**
   `VITE_MAPY_COM_API_KEY` = your Mapy.com API key. (It ends up in the public JavaScript anyway -- restrict it to
   the `gpsnavigator.github.io` referrer in the Mapy.com developer portal.)
3. **Actions > Deploy to GitHub Pages > Run workflow** (or push to `main`). The site appears at
   https://gpsnavigator.github.io/GeoTools/ after the run.
4. Optional, for server-side session logs: deploy the Worker (next section), then add the **variable**
   `VITE_SESSION_LOG_ENDPOINT` = the Worker URL (Settings > Secrets and variables > Actions > Variables) and re-run
   the workflow.

## Deploying the session logger (Cloudflare Worker)

Free Cloudflare account required. From `backend/session-logger`:

1. **Create a GitHub token**: github.com > Settings > Developer settings > Personal access tokens > Fine-grained
   tokens > Generate. Repository access: *Only select repositories* > `gpsnavigator/GeoTools`. Permissions:
   *Contents: Read and write*. Copy the token.
2. **Install and log in**:
   ```bash
   cd backend/session-logger
   npm install
   npx wrangler login
   ```
3. **Store the token as a Worker secret** (paste it when asked):
   ```bash
   npx wrangler secret put GITHUB_TOKEN
   ```
4. **Deploy**:
   ```bash
   npx wrangler deploy
   ```
   It prints the URL, e.g. `https://geotools-session-logger.<your-subdomain>.workers.dev`. Check it with
   `<url>/health` (should answer `{"ok":true}`).
5. Set that URL as the `VITE_SESSION_LOG_ENDPOINT` repository variable (step 4 above) and/or in `frontend/.env`.

`wrangler.toml` holds the non-secret settings: `GITHUB_REPO`, `GITHUB_BRANCH` (`data`) and `ALLOWED_ORIGINS`
(`https://gpsnavigator.github.io,http://localhost:5173`); requests from other origins get 403. The Worker accepts
`POST /` with a session document (max 512 KiB, `sessionId` of 8-64 letters/digits/dashes) and answers
`{ ok, path, receivedAt }`.

For local Worker development copy `.dev.vars.example` to `.dev.vars`, put a token in it and run `npm run dev`
(http://localhost:8787).

### Limits and caveats

- The endpoint is public by nature (the browser calls it), so anyone can post fake sessions from an allowed origin.
  Fine for an experiment; add Cloudflare rate limiting / Turnstile before relying on it.
- GitHub's API allows 5000 requests/hour per token; each snapshot costs two (read sha + write).
- Logging IP addresses and file names is personal data -- the page tells users it logs them. Keep the `data` branch
  private-minded (it is public if the repo is public) or move storage to a private repo by changing `GITHUB_REPO`.
