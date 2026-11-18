import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const APP_TITLE = 'GeoTools';

/** Shows `title` in the browser tab ("GPX & Photos – GeoTools") while the calling page is mounted. */
export function useDocumentTitle(title: string | null | undefined): void {
  useEffect(() => {
    document.title = title ? `${title} – ${APP_TITLE}` : APP_TITLE;
    return () => {
      document.title = APP_TITLE;
    };
  }, [title]);
}

/** The same, with the title given as an i18next key (re-resolved on a language change). */
export function useI18nDocumentTitle(titleKey: string | null | undefined, options?: Record<string, unknown>): void {
  const { t } = useTranslation();
  const translate = t as (key: string, opts?: Record<string, unknown>) => string;
  useDocumentTitle(titleKey ? translate(titleKey, options) : null);
}
