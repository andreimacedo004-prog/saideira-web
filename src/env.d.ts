/// <reference types="vite/client" />

/** Variaveis do .env.local que o app le. Todas as VITE_* ficam visiveis no navegador. */
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_CLOUDINARY_CLOUD?: string;
  readonly VITE_CLOUDINARY_PRESET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
