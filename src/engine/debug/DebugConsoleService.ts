import { logger } from '@/engine/logging';
import { ServiceRegistry, ServiceKeys } from '@/engine/registry';
import * as PIXI from 'pixi.js';
import { Scene } from '../scene';
import { GameObject } from '../GameObject';
import { Component } from '../Component';
import { profileStore } from '@/stores/game';

type CommandHandler = (args: string[]) => void;

/**
 * Сервис консольных команд для дебага ECS, PixiJS и состояния игры.
 * Предоставляет команды для инспекции состояния игры в реальном времени.
 * Доступен в dev-режиме через `window.debug`.
 */
export class DebugConsoleService {
  private static instance: DebugConsoleService | null = null;
  private commands = new Map<string, CommandHandler>();

  private constructor() {
    this._setupCommands();
  }

  public static getInstance(): DebugConsoleService {
    if (!this.instance) {
      this.instance = new DebugConsoleService();
    }
    return this.instance;
  }

  /**
   * Инициализация консольных команд
   */
  public initialize(): void {
    // Регистрируем команды в глобальном объекте window для доступа из консоли
    (window as any).debug = {
      // ECS
      entities: () => this._listEntities(),
      entity: (id: number) => this._inspectEntity([id.toString()]),
      components: () => this._listComponents(),
      systems: () => this._listSystems(),
      
      // PixiJS
      pixi: () => this._inspectPixiScene(),
      containers: () => this._listContainers(),
      sprites: () => this._listSprites(),
      filters: () => this._listFilters(),
      
      // Game State
      state: () => this._inspectGameState(),
      resources: () => this._inspectResources(),
      upgrades: () => this._inspectUpgrades(),
      
      // Utils
      help: () => this._help(),
      clear: () => this._clearConsole(),
      fps: () => this._showFPS()
    };
    
    logger.info('🔧 Debug Console Service initialized', { source: 'debug' });
    console.log('%c🔧 Debug Console доступен через window.debug', 'color: #0ff; font-weight: bold;');
    console.log('%c📋 Доступные команды: debug.help()', 'color: #0ff;');
  }

  /**
   * Настройка всех консольных команд
   */
  private _setupCommands(): void {
    const commandMap: Record<string, CommandHandler> = {
      // Help
      help: this._help,
      // ECS
      entities: this._listEntities,
      entity: this._inspectEntity,
      components: this._listComponents,
      systems: this._listSystems,
      // PixiJS
      pixi: this._inspectPixiScene,
      containers: this._listContainers,
      sprites: this._listSprites,
      filters: this._listFilters,
      // Game State
      state: this._inspectGameState,
      resources: this._inspectResources,
      upgrades: this._inspectUpgrades,
      // Utils
      clear: this._clearConsole,
      fps: this._showFPS,
    };

    for (const [name, handler] of Object.entries(commandMap)) {
      this.commands.set(name, handler.bind(this));
    }
  }

  /**
   * Выполнить команду
   */
  public execute(command: string, args: string[] = []): void {
    const cmd = this.commands.get(command);
    if (cmd) {
      cmd(args);
    } else {
      console.warn(`❌ Неизвестная команда: ${command}. Используйте help() для списка команд.`);
    }
  }

  /**
   * Показать справку по командам
   */
  private _help(): void {
    console.log('%c🔧 Debug Console Commands:', 'color: #0ff; font-size: 1.2em; font-weight: bold;');
    
    const commands = {
      '📊 ECS': {
        'entities()': 'Список всех GameObjects в сцене',
        'entity(id)': 'Детальная информация о GameObject',
        'components()': 'Список всех типов компонентов',
        'systems()': 'Список активных систем/менеджеров',
      },
      '🎨 PixiJS': {
        'pixi()': 'Общая информация о PixiJS сцене',
        'containers()': 'Список всех контейнеров',
        'sprites()': 'Список всех спрайтов',
        'filters()': 'Список всех фильтров',
      },
      '🎮 Game State': {
        'state()': 'Полное состояние игрового профиля',
        'resources()': 'Текущие ресурсы (из profileStore)',
        'upgrades()': 'Текущие апгрейды (из profileStore)',
      },
      '🛠️ Utils': {
        'clear()': 'Очистить консоль',
        'fps()': 'Показать FPS',
      },
    };

    for (const category in commands) {
      console.log(`\n%c${category}`, 'color: #f0f; font-weight: bold;');
      console.table(commands[category as keyof typeof commands]);
    }

    console.log('\n%cПримеры:', 'color: #0ff; font-weight: bold;');
    console.log('  debug.entities()');
    console.log('  debug.entity(123)');
    console.log('  debug.pixi()');
  }

  // =================================================================
  // ECS Commands
  // =================================================================

  /**
   * Список всех entities в сцене
   */
  private _listEntities(): void {
    try {
      const scene = this._getCurrentScene();
      if (!scene) {
        this._logError('Сцена не найдена');
        return;
      }

      const entities = scene.gameObjects;
      this._logInfo(`GameObjects в сцене: ${entities.length}`);
      
      const entityData = entities.map((entity: GameObject) => ({
        id: entity.id,
        name: entity.name,
        active: entity.active ? '✅' : '❌',
        components: entity.getComponents().map(c => c.constructor.name).join(', '),
      }));

      console.table(entityData);

    } catch (error) {
      this._logError('Ошибка при получении entities:', error);
    }
  }

  /**
   * Детальная информация об entity
   */
  private _inspectEntity(args: string[]): void {
    if (args.length === 0) {
      this._logWarn('Укажите ID entity: entity(123)');
      return;
    }

    const entityId = parseInt(args[0], 10);
    if (isNaN(entityId)) {
      this._logWarn('ID должен быть числом');
      return;
    }

    try {
      const scene = this._getCurrentScene();
      if (!scene) {
        this._logError('Сцена не найдена');
        return;
      }

      const entity = scene.gameObjects.find((e: GameObject) => e.id === entityId);
      
      if (!entity) {
        this._logWarn(`GameObject #${entityId} не найден`);
        return;
      }

      this._logInfo(`GameObject #${entityId}:`);
      console.dir(entity);

      console.log('%c  Components:', 'color: #f0f; font-weight: bold;');
      const components = entity.getComponents();
      if (components.length > 0) {
        const componentTable = components.reduce((acc, component) => {
          acc[component.constructor.name] = component;
          return acc;
        }, {} as Record<string, Component>);
        console.table(componentTable);
      } else {
        console.log('  (no components)');
      }

    } catch (error) {
      this._logError('Ошибка при инспекции entity:', error);
    }
  }

  /**
   * Список всех типов компонентов
   */
  private _listComponents(): void {
    try {
      const scene = this._getCurrentScene();
      if (!scene) {
        this._logError('Сцена не найдена');
        return;
      }

      const componentMap = new Map<string, number>();
      for (const entity of scene.gameObjects) {
        for (const component of entity.getComponents()) {
          const name = component.constructor.name;
          componentMap.set(name, (componentMap.get(name) || 0) + 1);
        }
      }

      this._logInfo(`Типы компонентов (${componentMap.size}):`);
      const componentData = Array.from(componentMap.entries()).map(([name, count]) => ({
        component: name,
        count: count,
      })).sort((a, b) => b.count - a.count);

      console.table(componentData);

    } catch (error) {
      this._logError('Ошибка при получении компонентов:', error);
    }
  }

  /**
   * Список активных систем
   */
  private _listSystems(): void {
    this._logInfo('Системы/Менеджеры:');
    
    const availableServices = [
      'Game',
      'SceneManager',
      'AssetManager',
      'PixiApp', 
      'PixiRenderer',
      'InputManager',
      'AudioManager',
      'EffectSystem',
    ];
    
    const serviceData = availableServices.map(serviceName => {
      let status = '❌';
      let details = 'Not Registered';
      try {
        const service = ServiceRegistry.get(serviceName);
        if (service) {
          status = '✅';
          details = service.constructor.name;
        }
      } catch (e) {
        // service not found
      }
      return { service: serviceName, status, details };
    });
    console.table(serviceData);
  }

  // =================================================================
  // PixiJS Commands
  // =================================================================

  /**
   * Инспекция PixiJS сцены
   */
  private _inspectPixiScene(): void {
    try {
      const pixiApp = ServiceRegistry.get<PIXI.Application>(ServiceKeys.PixiApp);
      if (!pixiApp) {
        this._logWarn('PixiJS приложение не найдено');
        return;
      }

      this._logInfo('PixiJS Scene:');
      const sceneData = {
        Renderer: pixiApp.renderer.type,
        Screen: `${pixiApp.screen.width}x${pixiApp.screen.height}`,
        Resolution: pixiApp.renderer.resolution,
        FPS: pixiApp.ticker.FPS.toFixed(1),
        'Stage Children': pixiApp.stage.children.length,
      };
      console.table(sceneData);

      this._logInfo('Stage Children:');
      this._inspectContainer(pixiApp.stage);

    } catch (error) {
      this._logError('Ошибка при инспекции PixiJS:', error);
    }
  }

  /**
   * Список всех контейнеров
   */
  private _listContainers(): void {
    try {
      const background = ServiceRegistry.get<PIXI.Container>(ServiceKeys.BackgroundContainer);
      const game = ServiceRegistry.get<PIXI.Container>(ServiceKeys.GameContainer);
      const ui = ServiceRegistry.get<PIXI.Container>(ServiceKeys.UIContainer);

      this._logInfo('PixiJS Containers:');
      if (background) {
        console.log('%c🎨 Background:', 'color: #0ff; font-weight: bold;');
        this._inspectContainer(background);
      }
      if (game) {
        console.log('%c🎮 Game:', 'color: #0ff; font-weight: bold;');
        this._inspectContainer(game);
      }
      if (ui) {
        console.log('%c🖥️ UI:', 'color: #0ff; font-weight: bold;');
        this._inspectContainer(ui);
      }
    } catch (error) {
      this._logError('Ошибка при получении контейнеров:', error);
    }
  }

  /**
   * Рекурсивная инспекция контейнера
   */
  private _inspectContainer(container: PIXI.Container, indent = ''): void {
    container.children.forEach((child) => {
      const name = child.name || child.constructor.name;
      const type = child.constructor.name;
      const visible = child.visible ? '✅' : '❌';
      const childrenCount = child instanceof PIXI.Container ? child.children.length : 0;
      
      console.log(`${indent}${visible} ${name} (${type}) - ${childrenCount} children`);
      
      if (child instanceof PIXI.Container && childrenCount > 0) {
        this._inspectContainer(child, indent + '  ');
      }
    });
  }

  /**
   * Список всех спрайтов
   */
  private _listSprites(): void {
    try {
      const gameContainer = ServiceRegistry.get<PIXI.Container>(ServiceKeys.GameContainer);
      if (!gameContainer) {
        this._logWarn('Game container не найден');
        return;
      }

      const sprites: PIXI.Sprite[] = [];
      this._collectSprites(gameContainer, sprites);

      this._logInfo(`Sprites в сцене: ${sprites.length}`);
      
      const spriteData = sprites.map((sprite, i) => ({
        name: sprite.name || `Sprite_${i}`,
        texture: (sprite.texture.source as any)?.label || 'unknown',
        visible: sprite.visible ? '✅' : '❌',
        position: `(${sprite.x.toFixed(0)}, ${sprite.y.toFixed(0)})`,
        scale: `(${sprite.scale.x.toFixed(1)}, ${sprite.scale.y.toFixed(1)})`,
        alpha: sprite.alpha.toFixed(2),
      }));
      console.table(spriteData);

    } catch (error) {
      this._logError('Ошибка при получении спрайтов:', error);
    }
  }

  /**
   * Рекурсивный сбор всех спрайтов
   */
  private _collectSprites(container: PIXI.Container, sprites: PIXI.Sprite[]): void {
    for (const child of container.children) {
      if (child instanceof PIXI.Sprite) {
        sprites.push(child);
      }
      if (child instanceof PIXI.Container) {
        this._collectSprites(child, sprites);
      }
    }
  }

  /**
   * Список всех фильтров
   */
  private _listFilters(): void {
    this._logWarn('Команда listFilters() временно отключена (требует рефакторинга EffectSystem).');
  }

  // =================================================================
  // Game State Commands
  // =================================================================

  /**
   * Состояние игровой логики
   */
  private _inspectGameState(): void {
    try {
      this._logInfo('Полное состояние игрока (profileStore):');
      const profile = profileStore.get();
      console.dir(profile);
    } catch (error) {
      this._logError('Ошибка при получении игрового состояния:', error);
    }
  }

  /**
   * Текущие ресурсы
   */
  private _inspectResources(): void {
    this._logWarn('Команда inspectResources() еще не реализована.');
    // TODO: Когда ресурсы появятся в profileStore, показывать их здесь.
    // Пример:
    // const resources = profileStore.get().resources;
    // console.table(resources);
  }

  /**
   * Текущие апгрейды
   */
  private _inspectUpgrades(): void {
    this._logWarn('Команда inspectUpgrades() еще не реализована.');
    // TODO: Когда апгрейды появятся в profileStore, показывать их здесь.
    // Пример:
    // const upgrades = profileStore.get().upgrades;
    // console.table(upgrades);
  }

  // =================================================================
  // Utility Commands
  // =================================================================

  /**
   * Очистить консоль
   */
  private _clearConsole(): void {
    console.clear();
    console.log('🧹 Консоль очищена');
  }

  /**
   * Показать FPS
   */
  private _showFPS(): void {
    try {
      const game = ServiceRegistry.get<import('../Game').Game>('Game');
      const pixiApp = ServiceRegistry.get<PIXI.Application>(ServiceKeys.PixiApp);

      const fpsData = {
        'Game Ticker FPS': game?.getFPS().toFixed(1) || 'N/A',
        'Game Running': game?.isRunning ? '✅' : '❌',
        'PixiJS Ticker FPS': pixiApp?.ticker.FPS.toFixed(1) || 'N/A',
      };
      console.table(fpsData);
    } catch (error) {
      this._logError('Ошибка при получении FPS:', error);
    }
  }

  // =================================================================
  // Private Helpers
  // =================================================================

  /**
   * Получить текущую сцену
   */
  private _getCurrentScene(): Scene | null {
    try {
      const sceneManager = ServiceRegistry.get<import('../scene/SceneManager').SceneManagerInstance>('SceneManager');
      return sceneManager?.current || null;
    } catch (error) {
      try {
        const game = ServiceRegistry.get<import('../Game').Game>('Game');
        return game?.getSceneManager()?.current || null;
      } catch (gameError) {
        this._logWarn('Не удалось получить текущую сцену: Service "SceneManager" or "Game" not found.');
        return null;
      }
    }
  }

  private _logInfo(message: string, ...args: any[]): void {
    console.log(`%c[INFO] ${message}`, 'color: #0ff;', ...args);
  }

  private _logWarn(message: string, ...args: any[]): void {
    console.warn(`%c[WARN] ${message}`, 'color: #ff0;', ...args);
  }

  private _logError(message: string, ...args: any[]): void {
    console.error(`%c[ERROR] ${message}`, 'color: #f00;', ...args);
  }
}

export const debugConsole = DebugConsoleService.getInstance();
