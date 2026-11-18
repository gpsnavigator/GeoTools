import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './en';
import { cs } from './cs';
import './types';

export type Language = 'en' | 'cs';
export const SUPPORTED_LANGUAGES: Language[] = ['en', 'cs'];
export const DEFAULT_LANGUAGE: Language = 'en';

const STORAGE_KEY = 'geotools_language';

/**
 * The persisted choice wins; otherwise we follow the browser language (Czech browsers default to
 * Czech, anything else to English).
 */
function detectInitialLanguage(): Language {
  let stored: string | null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    return DEFAULT_LANGUAGE;
  }
  if (stored === 'en' || stored === 'cs') {
    return stored;
  }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('cs')
    ? 'cs'
    : DEFAULT_LANGUAGE;
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    cs: { translation: cs },
  },
  lng: detectInitialLanguage(),
  supportedLngs: SUPPORTED_LANGUAGES,
  fallbackLng: DEFAULT_LANGUAGE,
  ns: ['translation'],
  interpolation: {
    // We render React elements, not HTML — no escaping.
    escapeValue: false,
  },
});

function syncLanguage(lng: string): void {
  const language = (SUPPORTED_LANGUAGES as string[]).includes(lng) ? (lng as Language) : DEFAULT_LANGUAGE;
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Storage is unavailable (private mode, tests); the in-memory choice still applies below.
  }
  document.documentElement.lang = language;
}

i18n.on('languageChanged', syncLanguage);
syncLanguage(i18n.language);

export default i18n;
