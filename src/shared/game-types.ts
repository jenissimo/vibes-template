/**
 * Game Types - централизованные типы игры
 * Все типы игровых объектов в одном месте
 */

export interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  currentSize: number;
  maxSize: number;
  hitRate: number;
}

export interface ParticleEmitterConfig {
  x: number;
  y: number;
  textureId?: string; // ID текстуры для частиц
  count: number;
  spread: number;
  speed: [number, number]; // [min, max] для вариативности
  life: [number, number];   // [min, max] для вариативности
  size: [number, number];   // [min, max] для вариативности
  startColor: number;
  endColor?: number; // Если указан, цвет будет меняться от startColor до endColor
  alpha: [number, number]; // [start, end] для плавного затухания
  gravity: number;
  friction: number;
  scaleSpeed?: number;
  rotationSpeed?: [number, number]; // [min, max] для вращения
}