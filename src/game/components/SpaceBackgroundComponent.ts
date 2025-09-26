// game/scenes/components/SpaceBackgroundComponent.ts
import { PixiSpriteRenderer, SpriteRendererConfig } from '@/engine/components/PixiSpriteRenderer';
import { SpaceBackgroundFilter } from '@/game/graphics/filters/SpaceBackgroundFilter';
import { logger } from '@/engine/logging';
import * as PIXI from 'pixi.js';

export interface SpaceBackgroundConfig {
  width?: number;
  height?: number;
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

export type SpaceMood = 'calm' | 'dynamic' | 'intense' | 'mystical' | 'cosmic' | 'aurora' | 'fire' | 'ice' | 'neon' | 'toxic' | 'sunset' | 'void' | 'crystal' | 'plasma' | 'storm' | 'zen' | 'galaxy' | 'nebula' | 'cosmic_rose' | 'emerald' | 'sapphire' | 'ruby' | 'amethyst' | 'sunrise';

export const SPACE_PRESETS: Record<SpaceMood, SpaceBackgroundConfig> = {
  calm: {
    starCount: 40,
    starBrightness: 1.0,
    twinkleSpeed: 0.5,
    nebulaIntensity: 0.4,
    nebulaColor1: '#0b1426',  // Глубокий космический синий
    nebulaColor2: '#1e3a5f',  // Средний синий с фиолетовым оттенком
    nebulaColor3: '#4a6fa5',  // Яркий голубой
    nebulaColor4: '#87ceeb'   // Нежный голубой
  },
  dynamic: {
    starCount: 80,
    starBrightness: 1.8,
    twinkleSpeed: 1.5,
    nebulaIntensity: 0.9,
    nebulaColor1: '#1a0b2e',  // Глубокий пурпурно-фиолетовый
    nebulaColor2: '#4a2c69',  // Средний фиолетовый
    nebulaColor3: '#9d4edd',  // Яркий пурпурный
    nebulaColor4: '#e0aaff'   // Светящийся лавандовый
  },
  intense: {
    starCount: 120,
    starBrightness: 2.5,
    twinkleSpeed: 2.0,
    nebulaIntensity: 1.3,
    nebulaColor1: '#2d1b00',  // Глубокий темно-оранжевый
    nebulaColor2: '#8b4513',  // Средний коричнево-красный
    nebulaColor3: '#ff6b35',  // Яркий оранжево-красный
    nebulaColor4: '#ffd23f'   // Светящийся золотой
  },
  mystical: {
    starCount: 60,
    starBrightness: 1.4,
    twinkleSpeed: 0.8,
    nebulaIntensity: 1.0,
    nebulaColor1: '#0f0f23',  // Глубокий мистический синий
    nebulaColor2: '#2d1b69',  // Средний пурпурно-синий
    nebulaColor3: '#6a4c93',  // Яркий пурпурный
    nebulaColor4: '#a8dadc'   // Светящийся бирюзовый
  },
  cosmic: {
    starCount: 100,
    starBrightness: 2.0,
    twinkleSpeed: 1.2,
    nebulaIntensity: 1.1,
    nebulaColor1: '#0a0a2e',  // Глубокий космический
    nebulaColor2: '#1a1a5e',  // Средний космический
    nebulaColor3: '#4a4a9e',  // Яркий космический
    nebulaColor4: '#8b5cf6'   // Светящийся космический
  },
  aurora: {
    starCount: 70,
    starBrightness: 1.6,
    twinkleSpeed: 0.9,
    nebulaIntensity: 1.0,
    nebulaColor1: '#001122',  // Глубокий темно-зеленый
    nebulaColor2: '#003d5b',  // Средний сине-зеленый
    nebulaColor3: '#00a8cc',  // Яркий бирюзовый
    nebulaColor4: '#4cc9f0'   // Светящийся небесно-голубой
  },
  fire: {
    starCount: 90,
    starBrightness: 2.2,
    twinkleSpeed: 1.8,
    nebulaIntensity: 1.2,
    nebulaColor1: '#2d0000',  // Глубокий темно-красный
    nebulaColor2: '#8b0000',  // Средний красный
    nebulaColor3: '#ff4500',  // Яркий оранжево-красный
    nebulaColor4: '#ffb347'   // Светящийся персиковый
  },
  ice: {
    starCount: 50,
    starBrightness: 1.3,
    twinkleSpeed: 0.6,
    nebulaIntensity: 0.8,
    nebulaColor1: '#000a1a',  // Глубокий темно-синий
    nebulaColor2: '#001f3f',  // Средний темно-синий
    nebulaColor3: '#4a9eff',  // Яркий голубой
    nebulaColor4: '#b3d9ff'   // Светящийся ледяной голубой
  },
  neon: {
    starCount: 90,
    starBrightness: 2.0,
    twinkleSpeed: 1.8,
    nebulaIntensity: 1.1,
    nebulaColor1: '#0a0a0a',  // Глубокий черный
    nebulaColor2: '#1a0a2e',  // Темно-фиолетовый
    nebulaColor3: '#00ff88',  // Яркий неоновый зеленый
    nebulaColor4: '#00ffff'   // Светящийся неоновый циан
  },
  toxic: {
    starCount: 75,
    starBrightness: 1.7,
    twinkleSpeed: 1.2,
    nebulaIntensity: 1.0,
    nebulaColor1: '#0a1a0a',  // Глубокий темно-зеленый
    nebulaColor2: '#2d5a2d',  // Средний зеленый
    nebulaColor3: '#88ff00',  // Яркий лайм
    nebulaColor4: '#ccff33'   // Светящийся ядовито-желтый
  },
  sunset: {
    starCount: 65,
    starBrightness: 1.5,
    twinkleSpeed: 0.9,
    nebulaIntensity: 0.9,
    nebulaColor1: '#2d1b00',  // Глубокий темно-коричневый
    nebulaColor2: '#8b4513',  // Средний коричневый
    nebulaColor3: '#ff6b35',  // Яркий закатный оранжевый
    nebulaColor4: '#ffd23f'   // Светящийся золотой
  },
  void: {
    starCount: 200,
    starBrightness: 0.8,
    twinkleSpeed: 0.3,
    nebulaIntensity: 0.2,
    nebulaColor1: '#000000',  // Глубокий черный
    nebulaColor2: '#0a0a0a',  // Темно-серый
    nebulaColor3: '#1a1a1a',  // Серый
    nebulaColor4: '#2a2a2a'   // Светло-серый
  },
  crystal: {
    starCount: 85,
    starBrightness: 1.9,
    twinkleSpeed: 1.4,
    nebulaIntensity: 1.0,
    nebulaColor1: '#0a0a1a',  // Глубокий темно-синий
    nebulaColor2: '#1a1a3a',  // Средний темно-синий
    nebulaColor3: '#4a9eff',  // Яркий голубой
    nebulaColor4: '#ffffff'   // Кристально белый
  },
  plasma: {
    starCount: 110,
    starBrightness: 2.3,
    twinkleSpeed: 2.2,
    nebulaIntensity: 1.4,
    nebulaColor1: '#1a0000',  // Глубокий темно-красный
    nebulaColor2: '#3a003a',  // Средний пурпурно-красный
    nebulaColor3: '#ff00ff',  // Яркий пурпурный
    nebulaColor4: '#00ffff'   // Светящийся циан
  },
  storm: {
    starCount: 95,
    starBrightness: 1.8,
    twinkleSpeed: 1.6,
    nebulaIntensity: 1.2,
    nebulaColor1: '#0a0a0a',  // Глубокий черный
    nebulaColor2: '#2d2d2d',  // Средний серый
    nebulaColor3: '#4a4a4a',  // Яркий серый
    nebulaColor4: '#8a8a8a'   // Светящийся серый
  },
  zen: {
    starCount: 30,
    starBrightness: 0.8,
    twinkleSpeed: 0.2,
    nebulaIntensity: 0.4,
    nebulaColor1: '#0a0a0a',  // Глубокий черный
    nebulaColor2: '#1a1a2a',  // Средний темно-синий
    nebulaColor3: '#2a3a4a',  // Яркий серо-синий
    nebulaColor4: '#4a5a6a'   // Светящийся серо-синий
  },
  galaxy: {
    starCount: 150,
    starBrightness: 2.1,
    twinkleSpeed: 1.3,
    nebulaIntensity: 1.2,
    nebulaColor1: '#0a0a2e',  // Глубокий космический синий
    nebulaColor2: '#2d1b69',  // Средний пурпурно-синий
    nebulaColor3: '#6a4c93',  // Яркий пурпурный
    nebulaColor4: '#c77dff'   // Светящийся фиолетовый
  },
  nebula: {
    starCount: 95,
    starBrightness: 1.7,
    twinkleSpeed: 1.0,
    nebulaIntensity: 1.3,
    nebulaColor1: '#0f0f23',  // Глубокий темно-синий
    nebulaColor2: '#1e3a5f',  // Средний синий
    nebulaColor3: '#4a9eff',  // Яркий голубой
    nebulaColor4: '#87ceeb'   // Светящийся небесно-голубой
  },
  cosmic_rose: {
    starCount: 80,
    starBrightness: 1.6,
    twinkleSpeed: 0.9,
    nebulaIntensity: 1.1,
    nebulaColor1: '#2d1b00',  // Глубокий темно-коричневый
    nebulaColor2: '#8b4513',  // Средний коричневый
    nebulaColor3: '#ff6b9d',  // Яркий розовый
    nebulaColor4: '#ffc0cb'   // Светящийся нежно-розовый
  },
  emerald: {
    starCount: 70,
    starBrightness: 1.5,
    twinkleSpeed: 0.8,
    nebulaIntensity: 1.0,
    nebulaColor1: '#001122',  // Глубокий темно-зеленый
    nebulaColor2: '#003d5b',  // Средний сине-зеленый
    nebulaColor3: '#50c878',  // Яркий изумрудный
    nebulaColor4: '#90ee90'   // Светящийся светло-зеленый
  },
  sapphire: {
    starCount: 85,
    starBrightness: 1.8,
    twinkleSpeed: 1.1,
    nebulaIntensity: 1.1,
    nebulaColor1: '#0b1426',  // Глубокий темно-синий
    nebulaColor2: '#1e3a5f',  // Средний синий
    nebulaColor3: '#0f52ba',  // Яркий сапфировый
    nebulaColor4: '#87ceeb'   // Светящийся голубой
  },
  ruby: {
    starCount: 100,
    starBrightness: 2.0,
    twinkleSpeed: 1.4,
    nebulaIntensity: 1.2,
    nebulaColor1: '#2d0000',  // Глубокий темно-красный
    nebulaColor2: '#8b0000',  // Средний красный
    nebulaColor3: '#e0115f',  // Яркий рубиновый
    nebulaColor4: '#ff69b4'   // Светящийся розово-красный
  },
  amethyst: {
    starCount: 75,
    starBrightness: 1.7,
    twinkleSpeed: 1.0,
    nebulaIntensity: 1.0,
    nebulaColor1: '#1a0b2e',  // Глубокий темно-фиолетовый
    nebulaColor2: '#4a2c69',  // Средний фиолетовый
    nebulaColor3: '#9966cc',  // Яркий аметистовый
    nebulaColor4: '#dda0dd'   // Светящийся сливовый
  },
  sunrise: {
    starCount: 60,
    starBrightness: 1.4,
    twinkleSpeed: 0.7,
    nebulaIntensity: 0.9,
    nebulaColor1: '#2d1b00',  // Глубокий темно-коричневый
    nebulaColor2: '#8b4513',  // Средний коричневый
    nebulaColor3: '#ffa500',  // Яркий оранжевый
    nebulaColor4: '#ffff99'   // Светящийся светло-желтый
  }
};

export class SpaceBackgroundComponent extends PixiSpriteRenderer {
  private spaceFilter: SpaceBackgroundFilter;
  private explicitSize: { width: number; height: number } | null = null;

  constructor(container: PIXI.Container, config?: SpaceBackgroundConfig) {
    // базовый полноэкранный спрайт с белой текстурой
    const spriteConfig: SpriteRendererConfig = {
      texture: PIXI.Texture.WHITE,
      x: 0, y: 0,
      scale: 1,
      alpha: 1,
      tint: 0xffffff,
      anchor: { x: 0, y: 0 },
      visible: true,
    };
    super(container, spriteConfig);

    // Создаем фильтр
    this.spaceFilter = new SpaceBackgroundFilter();
    
    // Применяем фильтр к спрайту
    this.sprite.filters = [this.spaceFilter];
    
    // Отладка: проверяем, что фильтр применился
    logger.debug('🎨 SpaceBackgroundFilter создан и применен', {
      hasFilter: !!this.spaceFilter,
      filtersCount: this.sprite.filters?.length || 0,
      spriteVisible: this.sprite.visible,
      source: 'space-bg'
    });

    // если размеры заданы — сохраняем
    if (config?.width && config?.height) {
      this.explicitSize = { width: config.width, height: config.height };
    }

    // применяем параметры фильтра
    if (config) this.configureSpaceBackground(config);
  }

  onAdded() {
    super.onAdded();
    this.updateSize(); // важно: сразу растянуть и задать filterArea
    
    // Отладка: проверяем состояние компонента
    logger.debug('🚀 SpaceBackgroundComponent добавлен', {
      spriteVisible: this.sprite.visible,
      spriteAlpha: this.sprite.alpha,
      spriteWidth: this.sprite.width,
      spriteHeight: this.sprite.height,
      hasFilter: !!this.spaceFilter,
      filtersCount: this.sprite.filters?.length || 0,
      containerChildren: this.pixiContainer?.children.length || 0,
      source: 'space-bg'
    });
  }

  onRemoved() {
    super.onRemoved();
  }

  update(deltaTime: number) {
    super.update(deltaTime);
    
    // Обновляем фильтр
    if (this.spaceFilter) {
      this.spaceFilter.update(deltaTime);
    } else {
      logger.warn('SpaceBackground: фильтр не найден при обновлении', { source: 'space-bg' });
    }
  }

  /** Публичный resize из сцены */
  public resize(width: number, height: number) {
    this.explicitSize = { width, height };
    this.updateSize();
  }

  /** Настройка фильтра */
  public configureSpaceBackground(options: SpaceBackgroundConfig) {
    logger.debug('🎨 Настраиваем SpaceBackgroundFilter', {
      options,
      hasFilter: !!this.spaceFilter,
      source: 'space-bg'
    });
    
    // Stars
    if (options.starCount          !== undefined) this.spaceFilter.setStarCount(options.starCount);
    if (options.starBrightness     !== undefined) this.spaceFilter.setStarBrightness(options.starBrightness);
    if (options.twinkleSpeed       !== undefined) this.spaceFilter.setTwinkleSpeed(options.twinkleSpeed);
    
    // Nebula
    if (options.nebulaIntensity    !== undefined) this.spaceFilter.setNebulaIntensity(options.nebulaIntensity);
    
    // Nebula colors
    if (options.nebulaColor1 || options.nebulaColor2 || options.nebulaColor3 || options.nebulaColor4) {
      const color1 = options.nebulaColor1 || '#0d0d2e';
      const color2 = options.nebulaColor2 || '#1a1a5e';
      const color3 = options.nebulaColor3 || '#4a4a9e';
      const color4 = options.nebulaColor4 || '#8b5cf6';
      this.spaceFilter.setNebulaColors(color1, color2, color3, color4);
    }
    
    // Scanline
    if (options.scanlineIntensity  !== undefined) this.spaceFilter.setScanlineIntensity(options.scanlineIntensity);
    if (options.scanlineSpeed      !== undefined) this.spaceFilter.setScanlineSpeed(options.scanlineSpeed);
  }

  public toggleScanline() {
    this.spaceFilter.toggleScanline();
  }

  public getSpaceBackgroundConfig() {
    return {
      starCount:         this.spaceFilter.getStarCount(),
      starBrightness:    this.spaceFilter.getStarBrightness(),
      twinkleSpeed:      this.spaceFilter.getTwinkleSpeed(),
      nebulaIntensity:   this.spaceFilter.getNebulaIntensity(),
      ...this.spaceFilter.getNebulaColors(),
      scanlineIntensity: this.spaceFilter.getScanlineIntensity(),
      scanlineSpeed:     this.spaceFilter.getScanlineSpeed(),
    };
  }

  /** Применить пресет настроения */
  public setSpaceMood(mood: SpaceMood) {
    const preset = SPACE_PRESETS[mood];
    if (!preset) {
      logger.warn(`Unknown space mood: ${mood}`, { source: 'space-bg' });
      return;
    }
    this.configureSpaceBackground(preset);
    logger.info(`🎨 Space background настроен на ${mood}`, { source: 'space-bg' });
  }

  /** Получить все доступные пресеты */
  public static getAvailablePresets(): SpaceMood[] {
    return Object.keys(SPACE_PRESETS) as SpaceMood[];
  }

  /** Получить случайный пресет */
  public static getRandomPreset(): SpaceMood {
    const presets = SpaceBackgroundComponent.getAvailablePresets();
    return presets[Math.floor(Math.random() * presets.length)];
  }

  // ——— internal ———

  private updateSize() {
    if (!this.pixiContainer) {
      logger.warn('SpaceBackground: нет контейнера для обновления размера', { source: 'space-bg' });
      return;
    }

    let w = this.explicitSize?.width  ?? 0;
    let h = this.explicitSize?.height ?? 0;

    if (w <= 0 || h <= 0) {
      // Без явных размеров фон не знает, куда растягиваться.
      // Делаем безопасный дефолт и предупреждаем.
      w = 1280; h = 720;
      logger.warn('SpaceBackground: размеры не заданы — использую 1280x720. Передавай width/height из layout.', { source: 'space-bg' });
    }

    // растягиваем спрайт
    this.sprite.position.set(0, 0);
    this.sprite.width  = w;
    this.sprite.height = h;

    // Устанавливаем filterArea на сам спрайт (как рекомендовано)
    this.sprite.filterArea = new PIXI.Rectangle(0, 0, w, h);

    // обновляем разрешение шейдера
    this.spaceFilter.setResolution(w, h);
    
    // Отладка: проверяем результат
    logger.debug('🎨 SpaceBackground размер обновлен', {
      width: w,
      height: h,
      spriteWidth: this.sprite.width,
      spriteHeight: this.sprite.height,
      spriteVisible: this.sprite.visible,
      spriteFilterArea: this.sprite.filterArea,
      source: 'space-bg'
    });
  }
}
