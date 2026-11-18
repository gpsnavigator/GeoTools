import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Language } from '../../i18n';
import Flag from './Flag';

/**
 * The language switch in the top menu bar: shows the flag of the language it switches *to*
 * and switches to the other language on click (persisted, defaults to the browser language).
 */
const LanguageToggle: React.FC = () => {
  const { t, i18n } = useTranslation();
  const current: Language = i18n.language === 'cs' ? 'cs' : 'en';
  const next: Language = current === 'cs' ? 'en' : 'cs';
  const switchLabel = t('language.switchTo', { language: t(next === 'cs' ? 'language.csName' : 'language.enName') });

  return (
    <button
      type="button"
      onClick={() => void i18n.changeLanguage(next)}
      title={switchLabel}
      aria-label={switchLabel}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-sm text-gray-300 hover:text-white hover:bg-gray-700"
    >
      {/* The flag of the language it will switch to: Czech in English, British in Czech. */}
      <Flag language={next} />
    </button>
  );
};

export default LanguageToggle;
