/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPY_COM_API_KEY?: string;
  readonly VITE_SESSION_LOG_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
