
interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  readonly VITE_MURF_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
