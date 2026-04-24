// main.ts — thin entry point; orchestration lives in GameBootstrap
import { logger } from '@/engine/logging';
import { mount } from 'svelte';
import App from './App.svelte';
import { GameBootstrap } from './engine/GameBootstrap';
import { GameConfig } from './engine/Game';
import { i18nService } from '@/engine/i18n';
import type { LanguagePreference } from '@/engine/i18n';

import './styles/theme.css';
import './utils/safeZoneTest';

// ---- State ----
let svelteApp: any = null;
let bootstrapPromise: Promise<void> | null = null;
const gameBootstrap = new GameBootstrap();

// ---- Game config ----
const gameConfig: GameConfig = {
  enableDebugOverlay: import.meta.env.DEV,
  enableFPSLimit: true,
  targetFPS: 60,
  enableAudio: true,
  enableEffects: true,
};

// ---- HMR handlers (must stay — import.meta.hot is module-scoped) ----
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    logger.info('🔥 HMR dispose', { source: 'main' });
    gameBootstrap.teardown();
    svelteApp?.$destroy?.() || svelteApp?.destroy?.();
    svelteApp = null;
  });

  import.meta.hot.accept('/src/game/scenes/GameScene.ts', (mod) => {
    const NewScene = mod?.GameScene;
    const sceneManager = gameBootstrap.getSceneManager();
    const game = gameBootstrap.getGame();
    if (NewScene && sceneManager?.replace && game) {
      logger.info('♻️ Hot-swap GameScene', { source: 'main' });
      sceneManager.replace(new NewScene(), game.getManagers());
    }
  });

  import.meta.hot.accept('/src/game/graphics/filters/index.ts', () => {
    logger.info('♻️ Reloading filters', { source: 'HMR' });
    const effectSystem = gameBootstrap.getGame()?.getManager('effects') as any;
    effectSystem?.reloadShaders?.();
  });

  import.meta.hot.accept('/src/App.svelte', () => {
    logger.info('♻️ HMR App.svelte — restart', { source: 'HMR' });
    gameBootstrap.teardown();
    svelteApp?.$destroy?.() || svelteApp?.destroy?.();
    svelteApp = null;
    bootstrapPromise = null;
    void bootstrap();
  });
}

// ---- Bootstrap ----
async function bootstrap() {
  if (bootstrapPromise) return bootstrapPromise;

  const run = async () => {
    // Initialize i18n BEFORE mounting Svelte so loc() works from first render
    if (!i18nService.getAvailableLocales().length) {
      const translationModules = import.meta.glob('/src/i18n/*.json', { eager: true });
      let savedPreference: LanguagePreference = 'system';
      try {
        const raw = localStorage.getItem('vibes-profile');
        if (raw) {
          const parsed = JSON.parse(raw);
          const pref = parsed?.data?.settings?.languagePreference;
          if (pref) savedPreference = pref as LanguagePreference;
        }
      } catch { /* use default */ }
      i18nService.initialize({
        fallbackLocale: 'en',
        translationModules,
        savedPreference,
      });
    }

    if (!svelteApp) {
      const target = document.getElementById('app');
      if (!target) throw new Error('#app root element is missing');
      svelteApp = mount(App, { target });
    }
    await gameBootstrap.boot(gameConfig);
  };

  bootstrapPromise = run()
    .catch((error) => { logger.error('❌ Bootstrap failed', error as Error); throw error; })
    .finally(() => { bootstrapPromise = null; });

  return bootstrapPromise;
}

// ---- DOMReady → init ----
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void bootstrap(), { once: true });
} else {
  void bootstrap();
}

export default svelteApp;
