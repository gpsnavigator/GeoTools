/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPY_COM_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
