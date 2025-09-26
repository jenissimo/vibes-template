import { Vector2 } from './types';

/**
 * Математические утилиты
 */
export class MathUtils {
  /**
   * Линейная интерполяция между двумя значениями
   */
  static lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * Ограничение значения в диапазоне
   */
  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Случайное число в диапазоне
   */
  static random(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  /**
   * Случайное целое число в диапазоне
   */
  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Расстояние между двумя точками
   */
  static distance(a: Vector2, b: Vector2): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Нормализация вектора
   */
  static normalize(vector: Vector2): Vector2 {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    if (length === 0) return { x: 0, y: 0 };
    return { x: vector.x / length, y: vector.y / length };
  }

  /**
   * Угол между двумя точками в радианах
   */
  static angle(from: Vector2, to: Vector2): number {
    return Math.atan2(to.y - from.y, to.x - from.x);
  }
}

/**
 * Утилиты для форматирования
 */
export class FormatUtils {
  /**
   * Форматирование больших чисел (1000 -> 1K, 1000000 -> 1M)
   */
  static formatNumber(num: number): string {
    if (num < 1000) return num.toString();
    
    const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp'];
    const magnitude = Math.floor(Math.log10(num) / 3);
    const scaled = num / Math.pow(1000, magnitude);
    
    return scaled.toFixed(1) + suffixes[magnitude];
  }

  /**
   * Форматирование времени (секунды -> MM:SS)
   */
  static formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Форматирование процентов
   */
  static formatPercent(value: number, decimals: number = 1): string {
    return `${(value * 100).toFixed(decimals)}%`;
  }
}

/**
 * Утилиты для работы с событиями
 */
export class EventUtils {
  /**
   * Создание кастомного события
   */
  static createCustomEvent<T = any>(
    type: string, 
    detail: T, 
    bubbles: boolean = true, 
    composed: boolean = true
  ): CustomEvent<T> {
    return new CustomEvent(type, {
      detail,
      bubbles,
      composed,
    });
  }

  /**
   * Асинхронная задержка
   */
  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
