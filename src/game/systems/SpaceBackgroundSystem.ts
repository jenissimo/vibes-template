import { System } from '@/engine/systems/System';
import { GameObject } from '@/engine/GameObject';
import { logger } from '@/engine/logging';
import { BakedSpaceBackgroundComponent } from '@/game/components/BakedSpaceBackgroundComponent';
import { SPACE_PRESETS, SpaceMood } from '@/game/components/SpaceBackgroundComponent';
import { PixiRenderer } from '@/engine/render/PixiRenderer';
import { eventBus } from '@/engine/events/EventBus';
import * as PIXI from 'pixi.js';

export interface SpaceBackgroundConfig {
  starCount?: number;
  starBrightness?: number;
  twinkleSpeed?: number;
  nebulaIntensity?: number;
  nebulaColor1?: string;
  nebulaColor2?: string;
  nebulaColor3?: string;
  nebulaColor4?: string;
  scanlineIntensity?: number;
  scanlineSpeed?: number;
}

/**
 * Система управления космическим фоном
 * Управляет созданием, обновлением и переключением пресетов фона
 */
export class SpaceBackgroundSystem extends System {
  private backgroundEntity?: GameObject;
  private backgroundComponent?: BakedSpaceBackgroundComponent;
  private backgroundContainer?: PIXI.Container;
  
  // Preset management
  private currentPresetIndex = 0;
  private readonly availablePresets = Object.keys(SPACE_PRESETS) as SpaceMood[];

  // Keyboard handling
  private readonly onKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowRight':
      case 'n':
        this.nextPreset();
        break;
      case 'ArrowLeft':
      case 'p':
        this.previousPreset();
        break;
      case 'r':
        this.randomPreset();
        break;
      case '1': this.setSpaceMood('calm'); break;
      case '2': this.setSpaceMood('dynamic'); break;
      case '3': this.setSpaceMood('intense'); break;
      case '4': this.setSpaceMood('mystical'); break;
      case '5': this.setSpaceMood('cosmic'); break;
      case '6': this.setSpaceMood('aurora'); break;
      case '7': this.setSpaceMood('fire'); break;
      case '8': this.setSpaceMood('ice'); break;
      case '9': this.setSpaceMood('neon'); break;
      case '0': this.setSpaceMood('toxic'); break;
    }
  };

  constructor(scene: any, backgroundContainer: PIXI.Container) {
    super(scene);
    this.backgroundContainer = backgroundContainer;
  }

  protected onStart(): void {
    this.createBackground();
    this.hookKeyboard();
    // Случайный выбор пресета при запуске
    this.currentPresetIndex = Math.floor(Math.random() * this.availablePresets.length);
    const randomMood = this.availablePresets[this.currentPresetIndex];
    this.setSpaceMood(randomMood);
  }

  protected onStop(): void {
    this.unhookKeyboard();
    this.destroyBackground();
  }

  protected onUpdate(deltaTime: number): void {
    // Обновляем анимацию фона если нужно
    this.backgroundComponent?.update?.(deltaTime);
  }

  protected onDestroy(): void {
    this.destroyBackground();
  }

  /**
   * Создать фоновый объект
   */
  private createBackground(): void {
    if (!this.backgroundContainer) {
      logger.warn('⚠️ BackgroundContainer не передан в SpaceBackgroundSystem');
      return;
    }

    // Получаем менеджеры через сцену
    const managers = (this.scene as any).managers;
    if (!managers) {
      logger.warn('⚠️ Менеджеры не найдены в сцене');
      return;
    }
    
    const { game } = managers;
    const renderer = (game.getManager('renderer') as PixiRenderer).getRenderer();

    this.backgroundComponent = new BakedSpaceBackgroundComponent(this.backgroundContainer, {
      renderer,
      mood: 'calm', // будет перезаписан в onStart
    });

    this.backgroundEntity = new GameObject()
      .setName('SpaceBackground')
      .add(this.backgroundComponent);

    this.scene.add(this.backgroundEntity);
    logger.info('✅ SpaceBackground создан системой');
  }

  /**
   * Уничтожить фоновый объект
   */
  private destroyBackground(): void {
    if (this.backgroundEntity) {
      this.scene.remove(this.backgroundEntity);
      this.backgroundEntity = undefined;
    }
    this.backgroundComponent = undefined;
  }

  /**
   * Настроить фон с дополнительными параметрами
   */
  configureSpaceBackground(opts: SpaceBackgroundConfig): void {
    if (!this.backgroundComponent) return;
    
    const managers = (this.scene as any).managers;
    if (!managers) return;
    
    const { game } = managers;
    const renderer = (game.getManager('renderer') as PixiRenderer).getRenderer();
    const mood = this.getCurrentPreset();
    
    this.backgroundComponent.rebake(renderer, { ...opts, mood });
    logger.info('🎨 Фон настроен', { opts, mood });
  }

  /**
   * Установить настроение фона
   */
  setSpaceMood(mood: SpaceMood): void {
    if (!this.backgroundComponent) return;
    
    const managers = (this.scene as any).managers;
    if (!managers) return;
    
    const { game } = managers;
    const renderer = (game.getManager('renderer') as PixiRenderer).getRenderer();
    
    this.backgroundComponent.rebake(renderer, { mood });
    logger.info(`🎨 Настроение фона изменено: ${mood}`);
  }

  /**
   * Переключение на следующий пресет
   */
  nextPreset(): void {
    this.currentPresetIndex = (this.currentPresetIndex + 1) % this.availablePresets.length;
    const nextPreset = this.availablePresets[this.currentPresetIndex];
    this.setSpaceMood(nextPreset);
    logger.info(`🎨 Переключено на пресет: ${nextPreset}`);
  }

  /**
   * Переключение на предыдущий пресет
   */
  previousPreset(): void {
    this.currentPresetIndex = this.currentPresetIndex === 0 
      ? this.availablePresets.length - 1 
      : this.currentPresetIndex - 1;
    const prevPreset = this.availablePresets[this.currentPresetIndex];
    this.setSpaceMood(prevPreset);
    logger.info(`🎨 Переключено на пресет: ${prevPreset}`);
  }

  /**
   * Случайный пресет
   */
  randomPreset(): void {
    this.currentPresetIndex = Math.floor(Math.random() * this.availablePresets.length);
    const randomPreset = this.availablePresets[this.currentPresetIndex];
    this.setSpaceMood(randomPreset);
    logger.info(`🎨 Случайный пресет: ${randomPreset}`);
  }

  /**
   * Получить текущий пресет
   */
  getCurrentPreset(): SpaceMood {
    return this.availablePresets[this.currentPresetIndex];
  }

  /**
   * Получить все доступные пресеты
   */
  getAvailablePresets(): SpaceMood[] {
    return [...this.availablePresets];
  }

  /**
   * Изменить размер фона
   */
  resize(width: number, height: number): void {
    this.backgroundComponent?.resize(width, height);
  }

  /**
   * Подключить обработку клавиатуры
   */
  private hookKeyboard(): void {
    eventBus.on('keydown', this.onKeyDown);
    logger.info('⌨️ Клавиатура подключена для управления фоном');
  }

  /**
   * Отключить обработку клавиатуры
   */
  private unhookKeyboard(): void {
    eventBus.off('keydown', this.onKeyDown);
    logger.info('⌨️ Клавиатура отключена для управления фоном');
  }
}
