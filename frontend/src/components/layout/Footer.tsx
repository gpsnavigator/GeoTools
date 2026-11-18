import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GITHUB_REPO_URL } from '../../utils/externalLinks';

const footerLinkClass = 'text-gray-400 hover:text-white transition';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 mt-auto py-8 border-t border-gray-700">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">{t('footer.tools')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/tools/gpx-photos" className={footerLinkClass}>{t('footer.gpxPhotos')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">{t('footer.links')}</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="https://mapy.com" target="_blank" rel="noopener noreferrer" className={footerLinkClass}>{t('footer.mapyCom')}</a></li>
              <li><a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" className={footerLinkClass}>{t('footer.openStreetMap')}</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">{t('footer.about')}</h3>
            <ul className="space-y-2 text-sm">
              <li><a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" className={footerLinkClass}>{t('footer.github')}</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-4 text-center text-gray-500 text-xs">
          {t('footer.copyright', { year })} &middot; {t('footer.mapData')} &copy;{' '}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">OpenStreetMap</a>
          {' '}&amp;{' '}
          <a href="https://api.mapy.com/copyright" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">Seznam.cz a.s.</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
