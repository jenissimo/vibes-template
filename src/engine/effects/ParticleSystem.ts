import * as PIXI from 'pixi.js';
import type { ParticleEmitterConfig } from '../../shared/game-types';

// Re-export for backward compatibility
export type { ParticleEmitterConfig };

// Параметры для инициализации или сброса частицы.
interface ParticleOptions {
  x: number;
  y: number;
  texture: PIXI.Texture;
  velocityX: number;
  velocityY: number;
  life: number;
  size: number;
  startColor: number;
  endColor: number;
  startAlpha: number;
  endAlpha: number;
  gravity: number;
  friction: number;
  scaleSpeed: number;
  rotationSpeed: number;
}

/**
 * Класс, представляющий одну частицу.
 * Инкапсулирует всю логику и состояние частицы.
 */
class Particle {
  public particle: PIXI.Particle;
  public isActive: boolean = false;

  // Свойства для обновления
  private x: number = 0;
  private y: number = 0;
  private velocityX: number = 0;
  private velocityY: number = 0;
  private life: number = 0;
  private maxLife: number = 1;
  private gravity: number = 0;
  private friction: number = 1;
  private initialSize: number = 1;
  private scale: number = 1;
  private scaleSpeed: number = 0;
  private rotation: number = 0;
  private rotationSpeed: number = 0;
  
  // Свойства для интерполяции цвета и альфы
  private startColor: [number, number, number] = [0, 0, 0];
  private endColor: [number, number, number] = [0, 0, 0];
  private startAlpha: number = 1;
  private endAlpha: number = 0;

  constructor() {
    // Создаем частицу для PixiJS 8
    this.particle = new PIXI.Particle({
      texture: PIXI.Texture.EMPTY, // Текстура будет задаваться при инициализации
    });
  }

  /**
   * "Оживляет" частицу из пула, задавая ей новые параметры.
   */
  public init(options: ParticleOptions): void {
    this.x = options.x;
    this.y = options.y;
    this.particle.texture = options.texture; // Устанавливаем текстуру
    this.velocityX = options.velocityX;
    this.velocityY = options.velocityY;
    this.life = options.life;
    this.maxLife = options.life;
    this.initialSize = options.size;
    this.gravity = options.gravity;
    this.friction = options.friction;
    this.scale = 1;
    this.scaleSpeed = options.scaleSpeed;
    this.rotation = 0;
    this.rotationSpeed = options.rotationSpeed;
    this.startAlpha = options.startAlpha;
    this.endAlpha = options.endAlpha;

    // Разложим цвет в компоненты 0..255 (без Color.shared, чтобы не плодить аллокации)
    const sc = options.startColor;
    const ec = options.endColor ?? sc;
    this.startColor = [(sc >> 16) & 255, (sc >> 8) & 255, sc & 255];
    this.endColor   = [(ec >> 16) & 255, (ec >> 8) & 255, ec & 255];
    
    this.isActive = true;

    // Сброс отрисовочных свойств
    this.particle.x = this.x;
    this.particle.y = this.y;
    this.particle.tint = sc;         // ← вместо color
    this.particle.alpha = this.startAlpha;
    this.particle.scaleX = this.initialSize;
    this.particle.scaleY = this.initialSize;
    this.particle.rotation = this.rotation;

    // Центруем частицу (приятнее для круглых/симметричных текстур)
    this.particle.anchorX = 0.5;
    this.particle.anchorY = 0.5;
  }

  /**
   * Обновляет состояние частицы на каждом кадре.
   * @param deltaTime Время, прошедшее с прошлого кадра.
   * @returns `true`, если частица все еще активна, иначе `false`.
   */
  public update(deltaTime: number): boolean {
    if (!this.isActive) {
      return false;
    }

    // авто-конвертация: если прилетели миллисекунды — переведём в секунды
    const delta = deltaTime > 2 ? deltaTime / 1000 : deltaTime;

    this.life -= delta;
    if (this.life <= 0) {
      this.isActive = false;
      return false;
    }

    // Физика
    this.velocityY += this.gravity * delta;
    this.velocityX *= this.friction;
    this.velocityY *= this.friction;
    this.x += this.velocityX * delta;
    this.y += this.velocityY * delta;
    
    // Трансформации
    const lifeRatio = 1 - (this.life / this.maxLife); // 0 -> 1
    this.scale = Math.max(0, this.scale + this.scaleSpeed * delta);
    this.rotation += this.rotationSpeed * delta;
    
    // Обновление частицы
    this.particle.x = this.x;
    this.particle.y = this.y;
    this.particle.rotation = this.rotation;
    this.particle.scaleX = this.initialSize * this.scale;
    this.particle.scaleY = this.initialSize * this.scale;
    
    // Интерполяция альфы и цвета (самая интересная часть!)
    this.particle.alpha = this.startAlpha + (this.endAlpha - this.startAlpha) * lifeRatio;
    
    // Цвет — через tint (быстро и без сюрпризов)
    const r = (this.startColor[0] + (this.endColor[0] - this.startColor[0]) * lifeRatio) | 0;
    const g = (this.startColor[1] + (this.endColor[1] - this.startColor[1]) * lifeRatio) | 0;
    const b = (this.startColor[2] + (this.endColor[2] - this.startColor[2]) * lifeRatio) | 0;
    this.particle.tint = (r << 16) | (g << 8) | b;
    
    return true;
  }
}

/**
 * Высокопроизводительная система частиц для PixiJS.
 * Использует PIXI.ParticleContainer, пул объектов и спрайты для максимальной скорости.
 * Создает красивые текстуры частиц через PIXI.Graphics.
 */
export class ParticleSystem {
  private _particleContainer: PIXI.ParticleContainer;
  private _pool: Particle[] = [];
  private _activeParticles: Particle[] = [];
  private _isRunning: boolean = false;
  private _textures: Map<string, PIXI.Texture> = new Map();
  
  // Максимальное количество частиц. Важно для производительности.
  private readonly _maxParticles: number;
  private readonly _renderer: PIXI.Renderer;
  
  constructor(parentContainer: PIXI.Container, renderer: PIXI.Renderer, maxParticles: number = 10000) {
    this._maxParticles = maxParticles;
    this._renderer = renderer;
    
    // Создаем ParticleContainer для PixiJS 8 с оптимизированными настройками
    this._particleContainer = new PIXI.ParticleContainer({
      dynamicProperties: {
        position: true,
        scale: true,
        rotation: true,
        color: true,
        alpha: true,
      },
    });
    
    // ADD-блендинг для неона
    this._particleContainer.blendMode = 'add';
    
    parentContainer.addChild(this._particleContainer);
    
    // Генерируем текстуры для частиц
    this._generateParticleTextures();

    // Предварительно заполняем пул, чтобы избежать создания объектов во время работы.
    this.growPool(Math.min(500, this._maxParticles));
  }
  
  /**
   * Генерация текстур для различных типов частиц
   */
  private _generateParticleTextures(): void {
    // Простая белая точка/квадрат - для искр и простых эффектов
    this._textures.set('default', PIXI.Texture.WHITE);
    
    // Мягкая круглая частица - идеальна для огня, дыма, магии
    // Уменьшаем размер с 64x64 до 16x16
    const softCircle = new PIXI.Graphics()
      .circle(8, 8, 7) // Центр 8,8, радиус 7
      .fill({ color: 0xFFFFFF });
    const softCircleTexture = this._renderer.generateTexture(softCircle);
    this._textures.set('soft_circle', softCircleTexture);

    // Квадрат с обводкой - ОСНОВНАЯ текстура для неоновых эффектов Tron-стиля
    // Уменьшаем размер с 32x32 до 8x8 для производительности
    const borderedSquare = new PIXI.Graphics()
        .rect(1, 1, 6, 6) // Внутренняя часть
        .fill({ color: 0xFFFFFF })
        .rect(1, 1, 6, 6) // Обводка
        .stroke({ width: 1, color: 0xFFFFFF });
    const borderedSquareTexture = this._renderer.generateTexture(borderedSquare);
    this._textures.set('bordered_square', borderedSquareTexture);

    // Дополнительные неоновые геометрические формы для разнообразия
    // Неоновый круг с обводкой
    const neonCircle = new PIXI.Graphics()
        .circle(4, 4, 3)
        .fill({ color: 0xFFFFFF })
        .circle(4, 4, 3)
        .stroke({ width: 1, color: 0xFFFFFF });
    const neonCircleTexture = this._renderer.generateTexture(neonCircle);
    this._textures.set('neon_circle', neonCircleTexture);

    // Неоновый треугольник с обводкой
    const neonTriangle = new PIXI.Graphics()
        .poly([
            new PIXI.Point(4, 1),
            new PIXI.Point(7, 6),
            new PIXI.Point(1, 6)
        ])
        .fill({ color: 0xFFFFFF })
        .poly([
            new PIXI.Point(4, 1),
            new PIXI.Point(7, 6),
            new PIXI.Point(1, 6)
        ])
        .stroke({ width: 1, color: 0xFFFFFF });
    const neonTriangleTexture = this._renderer.generateTexture(neonTriangle);
    this._textures.set('neon_triangle', neonTriangleTexture);

    // Неоновый квадрат (без обводки для контраста)
    const neonSquare = new PIXI.Graphics()
        .rect(1, 1, 6, 6)
        .fill({ color: 0xFFFFFF });
    const neonSquareTexture = this._renderer.generateTexture(neonSquare);
    this._textures.set('neon_square', neonSquareTexture);

    // Неоновый алмаз/ромб
    const neonDiamond = new PIXI.Graphics()
        .poly([
            new PIXI.Point(4, 1),
            new PIXI.Point(7, 4),
            new PIXI.Point(4, 7),
            new PIXI.Point(1, 4)
        ])
        .fill({ color: 0xFFFFFF })
        .poly([
            new PIXI.Point(4, 1),
            new PIXI.Point(7, 4),
            new PIXI.Point(4, 7),
            new PIXI.Point(1, 4)
        ])
        .stroke({ width: 1, color: 0xFFFFFF });
    const neonDiamondTexture = this._renderer.generateTexture(neonDiamond);
    this._textures.set('neon_diamond', neonDiamondTexture);

    // Неоновый шестиугольник
    const neonHexagon = new PIXI.Graphics();
    this._drawHexagon(neonHexagon, 4, 4, 3, 0xFFFFFF);
    const neonHexagonTexture = this._renderer.generateTexture(neonHexagon);
    this._textures.set('neon_hexagon', neonHexagonTexture);

    // Звездочка - для магических эффектов и блеска
    // Уменьшаем размер с 64x64 до 16x16
    const star = new PIXI.Graphics();
    this._drawStar(star, 8, 8, 5, 6, 3, 0xFFFFFF); // Центр 8,8, внешний радиус 6, внутренний 3
    const starTexture = this._renderer.generateTexture(star);
    this._textures.set('star', starTexture);

    // Треугольник - для осколков и острых частиц
    // Уменьшаем размер с 32x32 до 8x8
    const triangle = new PIXI.Graphics()
        .poly([
            new PIXI.Point(4, 1),
            new PIXI.Point(7, 7),
            new PIXI.Point(1, 7)
        ])
        .fill({ color: 0xFFFFFF });
    const triangleTexture = this._renderer.generateTexture(triangle);
    this._textures.set('triangle', triangleTexture);

    // Создаем простые текстуры частиц через Graphics
    const neonParticle = new PIXI.Graphics();
    neonParticle.circle(0, 0, 4).fill({ color: 0x00ff88, alpha: 1.0 });
    this._textures.set('neon_particle', this._renderer.generateTexture(neonParticle));

    const fireParticle = new PIXI.Graphics();
    fireParticle.circle(0, 0, 3).fill({ color: 0xff4500, alpha: 0.8 });
    this._textures.set('fire_particle', this._renderer.generateTexture(fireParticle));

    const iceParticle = new PIXI.Graphics();
    iceParticle.circle(0, 0, 3.5).fill({ color: 0x00ffff, alpha: 0.9 });
    this._textures.set('ice_particle', this._renderer.generateTexture(iceParticle));
  }

  /**
   * Рисует звезду для магических эффектов
   */
  private _drawStar(graphics: PIXI.Graphics, x: number, y: number, points: number, outerRadius: number, innerRadius: number, color: number): void {
    const angle = Math.PI / points;
    const points_array: PIXI.Point[] = [];
    
    for (let i = 0; i < 2 * points; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const currentAngle = i * angle - Math.PI / 2;
      const starX = x + Math.cos(currentAngle) * radius;
      const starY = y + Math.sin(currentAngle) * radius;
      points_array.push(new PIXI.Point(starX, starY));
    }
    
    graphics.poly(points_array).fill({ color });
  }

  /**
   * Рисует шестиугольник для неоновых эффектов
   */
  private _drawHexagon(graphics: PIXI.Graphics, x: number, y: number, radius: number, color: number): void {
    const points_array: PIXI.Point[] = [];
    
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const hexX = x + Math.cos(angle) * radius;
      const hexY = y + Math.sin(angle) * radius;
      points_array.push(new PIXI.Point(hexX, hexY));
    }
    
    // Заполнение
    graphics.poly(points_array).fill({ color });
    
    // Обводка
    graphics.poly(points_array).stroke({ width: 1, color });
  }
  
  /**
   * Увеличивает размер пула частиц.
   */
  private growPool(amount: number): void {
      for (let i = 0; i < amount; i++) {
          if (this._pool.length + this._activeParticles.length >= this._maxParticles) break;
          // Создаем частицу без текстуры - она будет задана при инициализации
          this._pool.push(new Particle());
      }
  }

  /**
   * Вспомогательная функция для получения случайного значения в диапазоне
   */
  private _randInRange(range: [number, number]): number {
    return range[0] + Math.random() * (range[1] - range[0]);
  }

  start(): void {
    this._isRunning = true;
  }

  stop(): void {
    this._isRunning = false;
    this.clear();
  }

  update(deltaTime: number): void {
    if (!this._isRunning) {
      return;
    }
    
    // Итерируем с конца, чтобы безопасно удалять элементы.
    for (let i = this._activeParticles.length - 1; i >= 0; i--) {
      const particle = this._activeParticles[i];
      
      if (!particle.update(deltaTime)) {
        // Частица "умерла". Используем "swap and pop" вместо splice.
        // 1. Меняем текущую мертвую частицу с последней в массиве.
        const lastParticle = this._activeParticles.pop()!;
        if (i < this._activeParticles.length) { // Если удаляемый элемент не был последним
             this._activeParticles[i] = lastParticle;
        }

        // 2. Убираем спрайт из контейнера и возвращаем объект в пул.
        this._particleContainer.removeParticle(particle.particle);
        this._pool.push(particle);
      }
    }
  }
  
  emit(config: ParticleEmitterConfig): void {
    const texture = this._textures.get(config.textureId || 'default')!;

    for (let i = 0; i < config.count; i++) {
      if (this._activeParticles.length >= this._maxParticles) break;
      
      // Берем частицу из пула
      let particle = this._pool.pop();

      // Если пул пуст, создаем новую частицу (аварийный вариант)
      if (!particle) {
         this.growPool(Math.min(config.count, 100)); // Растем эффективнее
         particle = this._pool.pop();
         if (!particle) continue; // Если достигли maxParticles, выходим
      }

      const angle = Math.random() * config.spread - (config.spread / 2);
      const speed = this._randInRange(config.speed);
      const life = this._randInRange(config.life);
      const size = this._randInRange(config.size);

      particle.init({
        x: config.x,
        y: config.y,
        texture: texture,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        life: life,
        size: size,
        startColor: config.startColor,
        endColor: config.endColor ?? config.startColor,
        startAlpha: config.alpha[0],
        endAlpha: config.alpha[1],
        gravity: config.gravity,
        friction: config.friction,
        scaleSpeed: config.scaleSpeed ?? -1 / life,
        rotationSpeed: config.rotationSpeed ? this._randInRange(config.rotationSpeed) : 0,
      });

      this._activeParticles.push(particle);
      this._particleContainer.addParticle(particle.particle);
    }
  }
  
  // --- ПРЕДУСТАНОВЛЕННЫЕ ЭФФЕКТЫ С НОВЫМИ ВОЗМОЖНОСТЯМИ ---

  emitExplosion(x: number, y: number, scale: number = 1): void {
    // Основной огненный шар - уменьшаем количество частиц для мобильных
    this.emit({
      x, y,
      textureId: 'soft_circle', // Используем мягкий круг
      count: Math.floor(12 * scale), // Было 20, стало 12
      spread: Math.PI * 2,
      speed: [150 * scale, 300 * scale],
      life: [0.8, 1.5],
      size: [8 * scale, 15 * scale],
      startColor: 0xFFD700,  // Ярко-желтый
      endColor: 0xFF4500,    // Оранжево-красный
      alpha: [1.0, 0],
      gravity: 0,
      friction: 0.96,
      scaleSpeed: -0.7,
    });
    
    // Искры - уменьшаем количество
    this.emit({
        x, y,
        textureId: 'default', // Для искр подойдет простой квадрат
        count: Math.floor(15 * scale), // Было 25, стало 15
        spread: Math.PI * 2,
        speed: [200 * scale, 450 * scale],
        life: [0.5, 1.0],
        size: [1 * scale, 3 * scale],
        startColor: 0xFFFFFF, // Белый
        endColor: 0xFFFF00,   // Желтый
        alpha: [1.0, 0],
        gravity: 100, // Искры могут падать
        friction: 0.95,
      });
  }

  emitDebris(x: number, y: number, scale: number = 1): void {
    this.emit({
      x, y,
      textureId: 'bordered_square', // Используем квадрат с обводкой для "остроты"
      count: Math.floor(15 * scale),
      spread: Math.PI * 2,
      speed: [50 * scale, 200 * scale],
      life: [1.5, 3.0],
      size: [3 * scale, 7 * scale],
      startColor: 0xAAAAAA,
      endColor: 0x666666,
      alpha: [1.0, 0.5],
      gravity: 400,
      friction: 0.9,
      rotationSpeed: [-5, 5] // Осколки должны вращаться!
    });
  }

  emitSparks(x: number, y: number, intensity: number = 1): void {
    this.emit({
      x, y,
      textureId: 'star', // Используем звездочки для искр
      count: Math.floor(15 * intensity),
      spread: Math.PI * 0.5,
      speed: [100 * intensity, 200 * intensity],
      life: [0.3, 0.8],
      size: [2, 4],
      startColor: 0xFFD700,
      endColor: 0xFF4500,
      alpha: [1.0, 0],
      gravity: 0,
      friction: 0.85,
      rotationSpeed: [-10, 10], // Искры вращаются
    });
  }

  emitDust(x: number, y: number, amount: number = 1): void {
    this.emit({
      x, y,
      textureId: 'soft_circle',
      count: Math.floor(20 * amount),
      spread: Math.PI * 2,
      speed: [10, 50],
      life: [1.0, 2.5],
      size: [4, 8],
      startColor: 0x808080,
      alpha: [0.4, 0],
      gravity: -30, // Пыль медленно поднимается
      friction: 0.98,
    });
  }

  emitMiningEffect(x: number, y: number, intensity: number = 1): void {
    // Metal sparks - уменьшаем для мобильных
    this.emit({
      x, y,
      textureId: 'star',
      count: Math.floor(5 * intensity), // Было 8, стало 5
      spread: Math.PI * 0.3,
      speed: [80 * intensity, 160 * intensity],
      life: [0.5, 1.0],
      size: [1.5, 3],
      startColor: 0xFFD700,
      endColor: 0xFF4500,
      alpha: [1.0, 0],
      gravity: 0,
      friction: 0.85,
      rotationSpeed: [-8, 8],
    });

    // Rock chips - уменьшаем количество
    this.emit({
      x, y,
      textureId: 'triangle', // Треугольники для осколков породы
      count: Math.floor(4 * intensity), // Было 6, стало 4
      spread: Math.PI * 0.4,
      speed: [60 * intensity, 140 * intensity],
      life: [0.8, 1.5],
      size: [2, 4],
      startColor: 0xFF4500,
      endColor: 0x8B4513,
      alpha: [1.0, 0.5],
      gravity: 150,
      friction: 0.9,
      rotationSpeed: [-6, 6],
    });
  }

  emitResourceGlow(x: number, y: number, color: number, size: number = 1): void {
    this.emit({
      x, y,
      textureId: 'neon_particle', // Используем неоновую частицу
      count: Math.floor(6 * size),
      spread: Math.PI * 2,
      speed: [20, 40],
      life: [1.0, 1.5],
      size: [1 * size, 2 * size],
      startColor: color,
      endColor: color,
      alpha: [0.7, 0],
      gravity: 0,
      friction: 0.98,
    });
  }

  // Новые эффекты с использованием PIXI.Graphics
  emitMagicEffect(x: number, y: number, intensity: number = 1): void {
    this.emit({
      x, y,
      textureId: 'star',
      count: Math.floor(12 * intensity),
      spread: Math.PI * 2,
      speed: [30, 80],
      life: [1.5, 2.5],
      size: [3, 6],
      startColor: 0x8b5cf6, // Фиолетовый
      endColor: 0x00ffff,   // Голубой
      alpha: [0.8, 0],
      gravity: -20, // Магия поднимается
      friction: 0.99,
      rotationSpeed: [-3, 3],
    });
  }

  emitFireEffect(x: number, y: number, intensity: number = 1): void {
    this.emit({
      x, y,
      textureId: 'fire_particle',
      count: Math.floor(15 * intensity),
      spread: Math.PI * 0.3,
      speed: [40, 120],
      life: [0.8, 1.5],
      size: [2, 5],
      startColor: 0xff4500,
      endColor: 0xffd700,
      alpha: [1.0, 0],
      gravity: -50, // Огонь поднимается
      friction: 0.95,
    });
  }

  emitIceEffect(x: number, y: number, intensity: number = 1): void {
    this.emit({
      x, y,
      textureId: 'ice_particle',
      count: Math.floor(10 * intensity),
      spread: Math.PI * 0.4,
      speed: [20, 60],
      life: [1.0, 2.0],
      size: [3, 6],
      startColor: 0x00ffff,
      endColor: 0xffffff,
      alpha: [0.9, 0.3],
      gravity: 100, // Лед падает
      friction: 0.98,
      rotationSpeed: [-2, 2],
    });
  }

  getParticleCount(): number {
    return this._activeParticles.length;
  }

  clear(): void {
    // Просто перемещаем все активные частицы обратно в пул.
    while (this._activeParticles.length) {
      const particle = this._activeParticles.pop()!;
      particle.isActive = false;
      this._particleContainer.removeParticle(particle.particle);
      this._pool.push(particle);
    }
  }

  destroy(): void {
    this.clear();
    this._particleContainer.destroy();
  }

  /**
   * Получить доступные типы текстур частиц
   */
  getAvailableTextures(): string[] {
    return Array.from(this._textures.keys());
  }

  /**
   * Добавить пользовательскую текстуру
   */
  addCustomTexture(id: string, texture: PIXI.Texture): void {
    this._textures.set(id, texture);
  }
}
