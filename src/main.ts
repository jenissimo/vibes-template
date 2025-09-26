// 0. Логгер — первым делом!
import { initializeLogger, logger } from '@/engine/logging';

import { mount } from 'svelte';
import App from './App.svelte';

import { Game, GameConfig } from './engine/Game';
import { GameScene } from './game/scenes/GameScene';
import { SceneEditorScene } from './scene-editor/scene/SceneEditorScene';
import { ServiceRegistry, ServiceKeys } from './engine/registry';
import { GameAssetService } from './game/assets/GameAssetService';
import { TextureFactory } from './game/graphics/TextureFactory';

import './styles/theme.css';
import './utils/safeZoneTest';
import { attachGlobalErrorHandlers } from './utils/errorOverlay';
import { domEventBridge } from '@/engine/events/DOMEventBridge';
import { eventBus } from '@/engine/events/EventBus';
import { panelPositioningService } from '@/engine/ui';
import { InputManager } from '@/engine/input/InputManager';
import { PreGameLoader } from './engine/PreGameLoader';
import { settingsInitService } from '@/stores/game';
import { appMode } from './stores/ui/appState';
import { debugConsole } from '@/engine/debug';

// ==== Глобальные ссылки этого модуля (не window) ====
let gameInstance: Game | null = null;
let svelteApp: any = null;
let unsubscribeSceneSwitcher: (() => void) | null = null;
let bootstrapPromise: Promise<void> | null = null;
let isTeardownPending = false;

// HMR: аккуратный teardown перед заменой модуля
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    logger.info('🔥 HMR dispose: tearing down', { source: 'main' });
    teardown();
    logger.info('✅ HMR dispose done', { source: 'main' });
  });

  // Горячая замена сцены
  import.meta.hot.accept('/src/game/scenes/GameScene.ts', (mod) => {
    const NewScene = mod?.GameScene;
    if (gameInstance && NewScene) {
      logger.info('♻️ Hot-swap Scene: GameScene', { source: 'main' });
      // Получаем SceneManager через Game
      const sceneManager = gameInstance.getSceneManager();
      if (sceneManager?.replace) {
        sceneManager.replace(new NewScene(), gameInstance.getManagers());
      } else {
        logger.warn('⚠️ SceneManager.replace not available, falling back to full restart', { source: 'main' });
      }
    }
  });

  // Горячая замена шейдеров/фильтров
  import.meta.hot.accept('/src/game/graphics/filters/index.ts', () => {
    logger.info('♻️ Reloading filters', { source: 'HMR' });
    const effectSystem = gameInstance?.getManager('effects') as any;
    if (effectSystem?.reloadShaders) {
      effectSystem.reloadShaders();
    } else {
      logger.warn('⚠️ EffectSystem.reloadShaders not available', { source: 'HMR' });
    }
  });

  // HMR для App.svelte - перезапускаем инициализацию
  import.meta.hot.accept('/src/App.svelte', () => {
    logger.info('♻️ HMR accept App.svelte - restarting bootstrap', { source: 'HMR' });
    teardown();
    setTimeout(() => {
      void bootstrap();
    }, 100);
  });
}

// ---- Конфиг игры ----
const gameConfig: GameConfig = {
  enableDebugOverlay: import.meta.env.DEV,
  enableFPSLimit: true,
  targetFPS: 60,
  enableAudio: true,
  enableEffects: true,
};

// ---- Утилиты ----
async function waitForCanvas(canvasId: string, maxRetries = 10, delay = 100): Promise<HTMLCanvasElement> {
  for (let i = 0; i < maxRetries; i++) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (canvas) {
      logger.info(`✅ Canvas found after ${i + 1} attempts`, { source: 'main' });
      return canvas;
    }
    
    logger.debug(`⏳ Canvas not found, retry ${i + 1}/${maxRetries}...`, { source: 'main' });
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  throw new Error(`Canvas #${canvasId} не найден после ${maxRetries} попыток`);
}

async function waitForAppReady(timeoutMs = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    let completed = false;

    const handler = () => {
      if (completed) return;
      completed = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      eventBus.off('app-ready', handler);
      logger.info('✅ App-ready event received', { source: 'main' });
      resolve(true);
    };

    const timeoutId = timeoutMs > 0
      ? setTimeout(() => {
          if (completed) return;
          completed = true;
          eventBus.off('app-ready', handler);
          logger.warn('⚠️ App-ready event not received within timeout, continuing with fallback', { source: 'main' });
          resolve(false);
        }, timeoutMs)
      : null;

    eventBus.on('app-ready', handler);
  });
}

// ---- Инициализация игры ----
async function initGame() {
  try {
    initializeLogger();
    attachGlobalErrorHandlers();
    
    // Запускаем PreGameLoader для загрузки шрифтов и базовых сервисов
    const preGameLoader = PreGameLoader.getInstance();
    await preGameLoader.load();

    // Проверяем canvas сразу - он должен быть в DOM
    const canvasId = 'pixi-canvas';
    let canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    
    if (!canvas) {
      logger.warn('⚠️ Canvas not found immediately, waiting for app-ready...', { source: 'main' });

      const appReadyReceived = await waitForAppReady();

      if (!appReadyReceived) {
        logger.info('🔁 App-ready not received, performing short fallback delay', { source: 'main' });
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      // Повторная проверка canvas после app-ready с retry
      canvas = await waitForCanvas(canvasId);
    } else {
      logger.info('✅ Canvas found immediately, skipping app-ready wait', { source: 'main' });
    }

    domEventBridge.initialize();

    logger.info('⚙️ Init settings…');
    await settingsInitService.initialize();
    logger.info('✅ Settings OK');

    logger.info('🎮 Создание игры…');
    const initialScene = appMode.get() === 'scene-editor' ? new SceneEditorScene() : new GameScene();
    gameInstance = new Game(gameConfig, initialScene);
    await gameInstance.initialize();

    // Регистрируем сервисы для debug console
    ServiceRegistry.register('Game', gameInstance);
    ServiceRegistry.register('SceneManager', gameInstance.getSceneManager());

    // Инициализируем debug console в dev режиме
    if (import.meta.env.DEV) {
      logger.info('🔧 Initializing debug console...');
      debugConsole.initialize();
      logger.info('✅ Debug console ready');
    }

    // Инициализируем и регистрируем игровые сервисы ПОСЛЕ инициализации Game
    const assetManager = ServiceRegistry.get<import('./engine/assets/AssetManager').AssetManager>(ServiceKeys.AssetManager);
    let gameAssetService: GameAssetService | null = null;
    if (assetManager) {
      gameAssetService = new GameAssetService(assetManager.loader);
      await gameAssetService.registerAssets();
      ServiceRegistry.register('gameAssetService', gameAssetService);

      const textureFactory = TextureFactory.getInstance();
      textureFactory.initialize();
      ServiceRegistry.register('textureFactory', textureFactory);
    }

    // Загружаем игровые текстуры
    if (gameAssetService) {
      await gameAssetService.loadTextures();
      eventBus.emit('game-assets-loaded');
      logger.info('✅ Игровые ассеты загружены и событие отправлено', { source: 'main' });
    }
    
    // Запускаем игру (Ticker запустится автоматически)
    gameInstance.startGame();
    logger.info('🚀 Игра запущена с Ticker', { source: 'main' });

    logger.info('✅ Игра инициализирована');

    // Переключатель сцен
    unsubscribeSceneSwitcher = appMode.subscribe(mode => {
      if (gameInstance) {
        const sceneManager = gameInstance.getSceneManager();
        const currentScene = sceneManager.current;

        // Избегаем ненужной замены сцены, если мы уже в нужном режиме
        if (
          (mode === 'scene-editor' && currentScene instanceof SceneEditorScene) ||
          (mode === 'game' && currentScene instanceof GameScene)
        ) {
          logger.info(`🎯 App mode is already '${mode}', skipping scene switch.`, { source: 'main' });
          return;
        }
        
        logger.info(`🔄 App mode changed to: ${mode}. Switching scene.`, { source: 'main' });
        const newScene = mode === 'scene-editor' ? new SceneEditorScene() : new GameScene();
        sceneManager.replace(newScene, gameInstance.getManagers());
      }
    });

  } catch (err) {
    logger.error('❌ Ошибка инициализации игры', err as Error);
  }
}

function teardown() {
  if (isTeardownPending) {
    return;
  }
  isTeardownPending = true;

  logger.info('🔥 Teardown: stopping game and cleaning services', { source: 'main' });

  const safe = (label: string, action: () => void) => {
    try {
      action();
    } catch (error) {
      logger.warn(`⚠️ Teardown step failed: ${label}`, { source: 'main', error });
    }
  };

  safe('gameInstance.destroy', () => {
    gameInstance?.destroy();
    gameInstance = null;
  });

  safe('DOMEventBridge.destroy', () => {
    domEventBridge.destroy();
  });

  safe('InputManager.resetInstance', () => {
    InputManager.resetInstance();
  });

  safe('eventBus.clear', () => {
    eventBus.clear();
  });

  safe('ServiceRegistry.clear', () => {
    ServiceRegistry.clear();
  });

  safe('PreGameLoader.resetInstance', () => {
    PreGameLoader.resetInstance();
  });

  safe('panelPositioningService.clearAll', () => {
    panelPositioningService.clearAll();
  });

  // AudioManager - singleton, не очищаем при HMR для сохранения состояния

  if (unsubscribeSceneSwitcher) {
    safe('unsubscribeSceneSwitcher', () => {
      unsubscribeSceneSwitcher?.();
      unsubscribeSceneSwitcher = null;
    });
  }

  safe('svelteApp.$destroy', () => {
    svelteApp?.$destroy?.() || svelteApp?.destroy?.();
    svelteApp = null;
  });

  logger.info('✅ Teardown complete', { source: 'main' });
  isTeardownPending = false;
}

async function bootstrap() {
  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  const run = async () => {
    if (!svelteApp) {
      const target = document.getElementById('app');
      if (!target) {
        throw new Error('#app root element is missing');
      }
      svelteApp = mount(App, { target });
    }

    await initGame();
  };

  bootstrapPromise = run()
    .catch((error) => {
      logger.error('❌ Bootstrap failed', error as Error);
      throw error;
    })
    .finally(() => {
      bootstrapPromise = null;
    });

  return bootstrapPromise;
}

// DOMReady → init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void bootstrap();
  }, { once: true });
} else {
  void bootstrap();
}

export default svelteApp;
