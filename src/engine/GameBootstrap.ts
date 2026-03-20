// engine/GameBootstrap.ts — Single entry-point for game initialization and teardown
import { initializeLogger, logger } from '@/engine/logging';
import { Game, GameConfig } from './Game';
import { GameScene } from '@/game/scenes/GameScene';
import { SceneEditorScene } from '@/scene-editor/scene/SceneEditorScene';
import { ServiceRegistry, ServiceKeys } from './registry';
import { GameAssetService } from '@/game/assets/GameAssetService';
import { TextureFactory } from '@/game/graphics/TextureFactory';
import { attachGlobalErrorHandlers } from '@/utils/errorOverlay';
import { domEventBridge } from '@/engine/events/DOMEventBridge';
import { eventBus } from '@/engine/events/EventBus';
import { panelPositioningService } from '@/engine/ui';
import { InputManager } from '@/engine/input/InputManager';
import { PreGameLoader } from './PreGameLoader';
import { settingsInitService } from '@/stores/game';
import { appMode } from '@/stores/ui/appState';
import { debugConsole } from '@/engine/debug';
import type { AssetManager } from './assets/AssetManager';

export class GameBootstrap {
  private game: Game | null = null;
  private unsubs: (() => void)[] = [];
  private isTeardownPending = false;

  async boot(config: GameConfig): Promise<Game> {
    initializeLogger();
    attachGlobalErrorHandlers();

    // Pre-load fonts & base services
    const preGameLoader = PreGameLoader.getInstance();
    await preGameLoader.load();

    // Wait for canvas to be available in DOM before PixiJS init
    await this.resolveCanvas('pixi-canvas');

    domEventBridge.initialize();

    logger.info('⚙️ Init settings…');
    await settingsInitService.initialize();
    logger.info('✅ Settings OK');

    // Create game
    logger.info('🎮 Создание игры…');
    const initialScene = appMode.get() === 'scene-editor'
      ? new SceneEditorScene()
      : new GameScene();
    this.game = new Game(config, initialScene);
    await this.game.initialize();

    // Register core services
    ServiceRegistry.register('Game', this.game);
    ServiceRegistry.register('SceneManager', this.game.getSceneManager());

    // Debug console (dev only)
    if (import.meta.env.DEV) {
      debugConsole.initialize();
      logger.info('✅ Debug console ready');
    }

    // Game asset services
    const assetManager = ServiceRegistry.get<AssetManager>(ServiceKeys.AssetManager);
    if (assetManager) {
      const gameAssetService = new GameAssetService(assetManager.loader);
      await gameAssetService.registerAssets();
      ServiceRegistry.register('gameAssetService', gameAssetService);

      const textureFactory = TextureFactory.getInstance();
      textureFactory.initialize();
      ServiceRegistry.register('textureFactory', textureFactory);

      await gameAssetService.loadTextures();
      eventBus.emit('game-assets-loaded');
      logger.info('✅ Игровые ассеты загружены', { source: 'bootstrap' });
    }

    // Start game
    this.game.startGame();
    logger.info('🚀 Игра запущена', { source: 'bootstrap' });

    // Scene switcher
    this.unsubs.push(
      appMode.subscribe(mode => {
        if (!this.game) return;
        const sceneManager = this.game.getSceneManager();
        const currentScene = sceneManager.current;

        if (
          (mode === 'scene-editor' && currentScene instanceof SceneEditorScene) ||
          (mode === 'game' && currentScene instanceof GameScene)
        ) return;

        logger.info(`🔄 App mode → ${mode}`, { source: 'bootstrap' });
        const newScene = mode === 'scene-editor' ? new SceneEditorScene() : new GameScene();
        sceneManager.replace(newScene, this.game!.getManagers());
      })
    );

    return this.game;
  }

  teardown(): void {
    if (this.isTeardownPending) return;
    this.isTeardownPending = true;

    logger.info('🔥 Teardown', { source: 'bootstrap' });

    const safe = (label: string, action: () => void) => {
      try { action(); } catch (error) {
        logger.warn(`⚠️ Teardown failed: ${label}`, { source: 'bootstrap', error });
      }
    };

    safe('game.destroy', () => { this.game?.destroy(); this.game = null; });
    safe('domEventBridge.destroy', () => domEventBridge.destroy());
    safe('InputManager.resetInstance', () => InputManager.resetInstance());
    safe('eventBus.clear', () => eventBus.clear());
    safe('ServiceRegistry.clear', () => ServiceRegistry.clear());
    safe('PreGameLoader.resetInstance', () => PreGameLoader.resetInstance());
    safe('panelPositioningService.clearAll', () => panelPositioningService.clearAll());

    for (const unsub of this.unsubs) {
      safe('unsub', unsub);
    }
    this.unsubs.length = 0;

    logger.info('✅ Teardown complete', { source: 'bootstrap' });
    this.isTeardownPending = false;
  }

  getGame(): Game | null {
    return this.game;
  }

  getSceneManager() {
    return this.game?.getSceneManager() ?? null;
  }

  // ---- Canvas resolution with retry ----
  private async resolveCanvas(canvasId: string): Promise<HTMLCanvasElement> {
    let canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (canvas) {
      logger.info('✅ Canvas found immediately', { source: 'bootstrap' });
      return canvas;
    }

    logger.warn('⚠️ Canvas not found, waiting for app-ready…', { source: 'bootstrap' });
    await this.waitForAppReady();
    canvas = await this.waitForCanvas(canvasId);
    return canvas;
  }

  private waitForAppReady(timeoutMs = 2000): Promise<boolean> {
    return new Promise((resolve) => {
      let completed = false;

      const handler = () => {
        if (completed) return;
        completed = true;
        if (timeoutId) clearTimeout(timeoutId);
        eventBus.off('app-ready', handler);
        resolve(true);
      };

      const timeoutId = timeoutMs > 0
        ? setTimeout(() => {
            if (completed) return;
            completed = true;
            eventBus.off('app-ready', handler);
            logger.warn('⚠️ App-ready timeout, continuing', { source: 'bootstrap' });
            resolve(false);
          }, timeoutMs)
        : null;

      eventBus.on('app-ready', handler);
    });
  }

  private async waitForCanvas(canvasId: string, maxRetries = 10, delay = 100): Promise<HTMLCanvasElement> {
    for (let i = 0; i < maxRetries; i++) {
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
      if (canvas) return canvas;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    throw new Error(`Canvas #${canvasId} not found after ${maxRetries} retries`);
  }
}
