// engine/Game.ts
import * as PIXI from 'pixi.js';
import { Scene } from "./scene/Scene";
import { SceneManager } from "./scene/SceneManager";
import { PixiRenderer } from "./render/PixiRenderer";
import { AssetManager } from "./assets/AssetManager";
import { InputManager } from "./input/InputManager";
import { EffectSystem } from "./effects/EffectSystem";
import { audioManager } from "./audio/AudioManager";
import { logger } from "./logging";
import { PixiConfig } from "./render/PixiRenderer";

export interface GameConfig {
  enableDebugOverlay?: boolean;
  enableFPSLimit?: boolean;
  targetFPS?: number;
  enableAudio?: boolean;
  enableEffects?: boolean;
  pixi?: PixiConfig;
}

export class Game {
  private pixiRenderer!: PixiRenderer;
  private assetManager!: AssetManager;
  private inputManager!: InstanceType<typeof InputManager>;
  private effectSystem!: EffectSystem;
  private audioManager = audioManager;
  private tickerCallback: ((ticker: PIXI.Ticker) => void) | null = null;
  private isInitialized = false;
  private config: GameConfig;

  constructor(config: GameConfig = {}, private firstScene: Scene) {
    this.config = {
      enableDebugOverlay: false,
      enableFPSLimit: true,
      targetFPS: 60,
      enableAudio: true,
      enableEffects: true,
      ...config
    };
  }

  /**
   * Инициализация всех менеджеров и систем игры
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Game уже инициализирован!', { source: 'game' });
      return;
    }

    logger.info('🎮 Инициализация игрового ядра...', { source: 'game' });

    try {
      // 1. Инициализация AssetManager (шрифты)
      logger.info('📦 Инициализация AssetManager...', { source: 'game' });
      this.assetManager = AssetManager.getInstance();
      await this.assetManager.initialize();
      logger.info('✅ AssetManager готов', { source: 'game' });

      // 2. Инициализация PixiRenderer
      logger.info('🎨 Инициализация PixiRenderer...', { source: 'game' });
      this.pixiRenderer = new PixiRenderer(this.config.pixi);
      await this.pixiRenderer.initialize();
      logger.info('✅ PixiRenderer готов', { source: 'game' });

      // 3. Загрузка текстур будет управляться из main.ts
      this.assetManager.loader.completeTextureLoading();

      // 4. Инициализация InputManager
      logger.info('🎮 Инициализация InputManager...', { source: 'game' });
      this.inputManager = InputManager.getInstance();
      this.inputManager.initialize();
      logger.info('✅ InputManager готов', { source: 'game' });

      // 5. Инициализация AudioManager
      if (this.config.enableAudio) {
        logger.info('🔊 Инициализация AudioManager...', { source: 'game' });
        await this.audioManager.initialize();
        logger.info('✅ AudioManager готов', { source: 'game' });
      }

      // 6. Создание EffectSystem (инициализация будет в сцене)
      if (this.config.enableEffects) {
        logger.info('✨ Создание EffectSystem...', { source: 'game' });
        const stage = this.pixiRenderer.getStage();
        this.effectSystem = new EffectSystem(stage, this.pixiRenderer.getRenderer(), this.audioManager);
        // Не запускаем сразу - сцена сама установит контейнер и запустит
        logger.info('✅ EffectSystem создан (будет инициализирован сценой)', { source: 'game' });
      }

      // 7. Setup game loop via PIXI ticker (single rAF, no dual-ticker desync)
      logger.info('⏱️ Setting up PIXI ticker callback...', { source: 'game' });
      this.tickerCallback = (ticker: PIXI.Ticker) => {
        const deltaTime = Math.min(ticker.deltaMS / 1000, 1 / 30);
        this.update(deltaTime);
      };
      logger.info('✅ Ticker callback ready', { source: 'game' });

      // 8. FPS limit
      if (this.config.enableFPSLimit && this.config.targetFPS) {
        this.pixiRenderer.setFPSLimit(this.config.targetFPS);
        logger.info(`🎯 FPS limit: ${this.config.targetFPS}`, { source: 'game' });
      }

      this.isInitialized = true;
      logger.info('🎉 Игровое ядро полностью инициализировано!', { source: 'game' });
    } catch (error) {
      logger.error('❌ Ошибка инициализации игрового ядра', error as Error);
      throw error;
    }
  }

  /**
   * Запуск игры и переключение на первую сцену
   */
  public startGame(): void {
    if (!this.isInitialized) {
      throw new Error('Игра не инициализирована. Вызовите initialize() сначала.');
    }
    logger.info('🚀 Starting game...', { source: 'game' });
    this.firstScene.initialize(this.getManagers());
    SceneManager().switch(this.firstScene);

    // Attach to PIXI ticker
    const pixiTicker = this.pixiRenderer.getApp().ticker;
    if (this.tickerCallback) {
      pixiTicker.add(this.tickerCallback);
    }
    logger.info('✅ Game started, ticker running', { source: 'game' });
  }

  /**
   * Остановка игры
   */
  public stopGame(): void {
    const pixiTicker = this.pixiRenderer?.getApp()?.ticker;
    if (pixiTicker && this.tickerCallback) {
      pixiTicker.remove(this.tickerCallback);
      logger.info('⏹️ Game loop stopped', { source: 'game' });
    }
  }

  /**
   * Обновление всех систем игры
   */
  public update(deltaTime: number): void {
    if (!this.isInitialized) {
      logger.warn('Game не инициализирован!', { source: 'game' });
      return;
    }

    // Обновляем все менеджеры
    this.inputManager.update(deltaTime);
    
    if (this.effectSystem) {
      this.effectSystem.update(deltaTime);
    }

    // Обновляем сцену
    SceneManager().update(deltaTime);
  }

  /**
   * Получить менеджер по типу
   */
  public getManager<T>(managerType: 'renderer' | 'assets' | 'input' | 'effects' | 'audio'): T {
    switch (managerType) {
      case 'renderer':
        return this.pixiRenderer as T;
      case 'assets':
        return this.assetManager as T;
      case 'input':
        return this.inputManager as T;
      case 'effects':
        return this.effectSystem as T;
      case 'audio':
        return this.audioManager as T;
      default:
        throw new Error(`Неизвестный тип менеджера: ${managerType}`);
    }
  }

  /**
   * Получить все менеджеры для передачи в сцену
   */
  public getManagers() {
    return {
      renderer: this.pixiRenderer,
      assets: this.assetManager,
      input: this.inputManager,
      effects: this.effectSystem,
      audio: this.audioManager,
      stage: this.pixiRenderer.getStage(),
      game: this, // Добавляем ссылку на сам объект Game
    };
  }

  /**
   * Получить SceneManager для HMR
   */
  public getSceneManager() {
    return SceneManager();
  }

  /**
   * Проверить, инициализирована ли игра
   */
  public get initialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Получить текущий FPS
   */
  public getFPS(): number {
    return this.pixiRenderer?.getCurrentFPS() ?? 0;
  }

  public get isRunning(): boolean {
    return this.pixiRenderer?.getApp()?.ticker?.started ?? false;
  }

  /**
   * Очистка ресурсов
   */
  public destroy(): void {
    if (!this.isInitialized) return;

    logger.info('🧹 Очистка игрового ядра...', { source: 'game' });

    // Remove game loop from PIXI ticker
    this.stopGame();

    // Очищаем системы в обратном порядке
    if (this.effectSystem) {
      this.effectSystem.stop();
      this.effectSystem.clear();
    }

    // AudioManager - singleton, не очищаем при destroy

    if (this.inputManager) {
      this.inputManager.destroy();
    }

    if (this.assetManager) {
      this.assetManager.destroy();
    }

    if (this.pixiRenderer) {
      this.pixiRenderer.destroy();
    }

    this.isInitialized = false;
    logger.info('✅ Игровое ядро очищено', { source: 'game' });
  }
}
