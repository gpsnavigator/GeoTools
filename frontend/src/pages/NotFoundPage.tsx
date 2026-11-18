import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useI18nDocumentTitle } from '../hooks/useDocumentTitle';

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();
  useI18nDocumentTitle('notFound.title');

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm text-center">
      <h1 className="text-2xl font-bold text-gray-900">{t('notFound.heading')}</h1>
      <p className="mt-2 text-gray-600">{t('notFound.text')}</p>
      <Link to="/" className="mt-4 inline-block rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
        {t('notFound.back')}
      </Link>
    </div>
  );
};

export default NotFoundPage;
