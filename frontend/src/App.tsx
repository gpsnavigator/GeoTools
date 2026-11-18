import React, { Suspense, lazy } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';

// Tool pages are loaded on demand, so the home page doesn't download Leaflet and exifr.
const GpxPhotosPage = lazy(() => import('./pages/tools/GpxPhotosPage'));

const PageLoading: React.FC = () => <div className="h-40 animate-pulse rounded-lg bg-gray-200" />;

// HashRouter: GitHub Pages has no SPA fallback, so a deep link like /GeoTools/tools/gpx-photos would 404.
// With hash routing the server only ever serves index.html (/GeoTools/#/tools/gpx-photos).
const App: React.FC = () => (
  <HashRouter>
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="tools/gpx-photos" element={<Suspense fallback={<PageLoading />}><GpxPhotosPage /></Suspense>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  </HashRouter>
);

export default App;
