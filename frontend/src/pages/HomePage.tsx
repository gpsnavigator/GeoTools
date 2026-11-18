import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useI18nDocumentTitle } from '../hooks/useDocumentTitle';

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  useI18nDocumentTitle('home.title');

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">{t('home.heading')}</h1>
        <p className="mt-2 text-gray-600">{t('home.intro')}</p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('home.toolsHeading')}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/tools/gpx-photos"
            className="group rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl" aria-hidden="true">🗺️</span>
              <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-700">{t('nav.gpxPhotos')}</h3>
            </div>
            <p className="mt-2 text-sm text-gray-600">{t('home.gpxPhotosDescription')}</p>
            <span className="mt-3 inline-block text-sm font-medium text-blue-600 group-hover:underline">{t('home.open')} →</span>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
