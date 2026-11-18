# GeoTools

Small web app with UI tools and calculators for geocaching and general work with coordinates and maps. Hosted as a **GitHub Pages** site: https://gpsnavigator.github.io/GeoTools/ (repo https://github.com/gpsnavigator/GeoTools).

See [README.md](README.md) for the feature list, setup and deployment. [AGENTS.md](AGENTS.md) holds the same rules for other coding agents -- keep the two in sync.

## Hard constraints

- **GitHub Pages only serves static files.** Everything in `frontend/` must build to plain HTML/JS/CSS. No server-side rendering, no Node server, no API routes, no runtime that Pages can't host.
  - Routing uses `HashRouter` (Pages has no SPA fallback for deep links).
  - Vite `base` is `/GeoTools/` in production builds; reference assets through imports or `import.meta.env.BASE_URL`, never absolute `/...` paths.
  - Anything that needs a secret (tokens, write access) can't live in the frontend bundle.
- **`context/` is read-only reference material** (e.g. `context/fody`, the UI reference app). Never edit it, never commit it (it is in `.gitignore`), never import from it at build time -- copy what is needed into `frontend/`. It will be deleted after initial development.
- Commit to `main` and push directly to `origin` (https://github.com/gpsnavigator/GeoTools) after each commit. Pushing to `main` triggers the Pages deploy workflow (`.github/workflows/deploy.yml`).

## Stack

- **Frontend:** `frontend/` -- React 19 + Vite + TypeScript (strict), Tailwind CSS v4 (`@tailwindcss/vite`), React Router (HashRouter), i18next (English + Czech), Leaflet + React-Leaflet, exifr for EXIF.
- **Deploy:** GitHub Actions builds `frontend/` and publishes `frontend/dist` to Pages.

## Conventions

- Visual style, layout and components follow the Fody app (dark gray header with dropdown menus, gray-50 page, white rounded cards, blue accents). Reuse the existing components in `frontend/src/components/` before writing new ones.
- **i18n:** every user-visible string is an i18next key; `en.ts` and `cs.ts` share one shape (`cs.ts` is typed against `en.ts`, a missing key is a compile error). Brand names (OpenStreetMap, Mapy.com) stay raw.
- **Maps:** every map uses `BaseLayersControl` (OpenStreetMap + Mapy.com outdoor). The Mapy.com key comes from `VITE_MAPY_COM_API_KEY` (`frontend/.env` locally, repository secret in CI) -- never hardcode it.
- **Files stay in the browser.** Tools read user files client-side; nothing is uploaded.
- Keep the README describing the *current* state (features, setup, deploy); no changelogs.

## Commands

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173/GeoTools/
npm run build    # tsc -b && vite build -- run before calling a change done
npm run lint
```
