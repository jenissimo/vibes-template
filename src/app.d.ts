/// <reference types="svelte" />
/// <reference types="pixi.js" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REMOTE_DEBUG_URL?: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    // reserved for future global declarations
  }
}

export {};
