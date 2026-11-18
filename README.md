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

Files are read in the browser only -- nothing is uploaded.

## Project layout

```
frontend/                  React 19 + Vite + TypeScript + Tailwind v4 (HashRouter, i18next EN/CS, React-Leaflet, exifr)
  src/pages/tools/         tool pages (GpxPhotosPage.tsx)
  src/components/          layout (header/footer), map (base layers, expandable map), shared UI
  src/i18n/                en.ts (source of truth) + cs.ts
.github/workflows/deploy.yml   build + deploy to GitHub Pages on push to main
```

## Local development

```bash
cd frontend
cp .env.example .env      # fill in VITE_MAPY_COM_API_KEY
npm install
npm run dev               # http://localhost:5173/GeoTools/
npm run build             # type check + production build into frontend/dist
npm run lint
```

Without a Mapy.com key the Mapy.com layer shows no tiles; switch to OpenStreetMap in the layer control.

## Deploying to GitHub Pages

Pushing to `main` runs [.github/workflows/deploy.yml](.github/workflows/deploy.yml): `npm ci`, lint, build, and
publish `frontend/dist` to Pages. Note: on a free GitHub plan Pages works only for **public** repositories (a private
repo needs GitHub Pro).

One-time setup in the GitHub web UI:

1. **Settings > Pages > Build and deployment > Source: GitHub Actions.**
2. **Settings > Secrets and variables > Actions > Secrets > New repository secret:**
   `VITE_MAPY_COM_API_KEY` = your Mapy.com API key. (It ends up in the public JavaScript anyway -- restrict it to
   the `gpsnavigator.github.io` referrer in the Mapy.com developer portal.)
3. **Actions > Deploy to GitHub Pages > Run workflow** (or push to `main`). The site appears at
   https://gpsnavigator.github.io/GeoTools/ after the run.
