// engine/components/ITweenable.ts

/**
 * Интерфейс для компонентов, которые могут анимироваться через GSAP
 * Определяет стандартные свойства для анимации
 */
export interface ITweenable {
  /** Прозрачность (0-1) */
  alpha: number;
  
  /** Универсальный масштаб */
  scale: number;
  
  /** Поворот в радианах */
  rotation: number;
  
  /** Позиция X */
  x: number;
  
  /** Позиция Y */
  y: number;
}

/**
 * Базовый класс для компонентов с анимацией
 * Предоставляет стандартную реализацию ITweenable
 */
export abstract class TweenableComponent {
  protected _alpha: number = 1;
  protected _scale: number = 1;
  protected _rotation: number = 0;
  protected _x: number = 0;
  protected _y: number = 0;

  get alpha(): number {
    return this._alpha;
  }

  set alpha(value: number) {
    this._alpha = value;
    this.updateDisplay();
  }

  get scale(): number {
    return this._scale;
  }

  set scale(value: number) {
    this._scale = value;
    this.updateDisplay();
  }

  get rotation(): number {
    return this._rotation;
  }

  set rotation(value: number) {
    this._rotation = value;
    this.updateDisplay();
  }

  get x(): number {
    return this._x;
  }

  set x(value: number) {
    this._x = value;
    this.updateDisplay();
  }

  get y(): number {
    return this._y;
  }

  set y(value: number) {
    this._y = value;
    this.updateDisplay();
  }

  /**
   * Обновить отображение компонента
   * Должен быть реализован в наследниках
   */
  protected abstract updateDisplay(): void;
}
