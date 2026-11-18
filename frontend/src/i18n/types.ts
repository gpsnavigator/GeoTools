import type { en } from './en';

/**
 * Makes i18next (and `useTranslation`) type-safe: `t()` only accepts keys that exist in the
 * English resource (the source of truth), so a mistyped or missing key is a compile error.
 * Czech is checked separately — `cs.ts` is typed as `typeof en`.
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    resources: {
      translation: typeof en;
    };
  }
}

export {};
