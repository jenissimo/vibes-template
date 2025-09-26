/**
 * DOM Event Bridge - мост между нативными DOM событиями и EventBus
 * Перехватывает нативные события и перенаправляет их в EventBus
 */

import { eventBus } from './EventBus';

export class DOMEventBridge {
  private static instance: DOMEventBridge;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): DOMEventBridge {
    if (!DOMEventBridge.instance) {
      DOMEventBridge.instance = new DOMEventBridge();
    }
    return DOMEventBridge.instance;
  }

  /**
   * Инициализация моста - перехватывает нативные события
   */
  public initialize(): void {
    if (this.isInitialized) return;
    
    // Перехватываем window события
    window.addEventListener('resize', this.handleWindowResize);
    window.addEventListener('error', this.handleWindowError);
    window.addEventListener('unhandledrejection', this.handleWindowUnhandledRejection);

    // Перехватываем document события
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('dblclick', this.handleDoubleClick);
    document.addEventListener('wheel', this.handleWheel, { passive: false });

    // Перехватываем mouse/touch события для drag & drop
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('touchmove', this.handleTouchMove);
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('touchend', this.handleTouchEnd);

    this.isInitialized = true;
  }

  /**
   * Очистка моста
   */
  public destroy(): void {
    if (!this.isInitialized) return;
    
    // Удаляем все обработчики (используем те же функции, что и при добавлении)
    window.removeEventListener('resize', this.handleWindowResize);
    window.removeEventListener('error', this.handleWindowError);
    window.removeEventListener('unhandledrejection', this.handleWindowUnhandledRejection);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('dblclick', this.handleDoubleClick);
    document.removeEventListener('wheel', this.handleWheel);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('touchend', this.handleTouchEnd);

    this.isInitialized = false;
  }

  // Обработчики событий как методы класса для правильной привязки
  private handleWindowResize = (event: Event) => {
    eventBus.emit('window-resize', event);
  };

  private handleWindowError = (event: ErrorEvent) => {
    eventBus.emit('window-error', event);
  };

  private handleWindowUnhandledRejection = (event: PromiseRejectionEvent) => {
    eventBus.emit('window-unhandledrejection', event);
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    eventBus.emit('keydown', event);
  };

  private handleDoubleClick = (event: MouseEvent) => {
    eventBus.emit('dblclick', event);
  };

  private handleWheel = (event: WheelEvent) => {
    eventBus.emit('wheel', event);
  };

  private handleMouseDown = (event: MouseEvent) => {
    eventBus.emit('mousedown', event);
  };

  private handleMouseMove = (event: MouseEvent) => {
    eventBus.emit('mousemove', event);
  };

  private handleTouchMove = (event: TouchEvent) => {
    eventBus.emit('touchmove', event);
  };

  private handleMouseUp = (event: MouseEvent) => {
    eventBus.emit('mouseup', event);
  };

  private handleTouchEnd = (event: TouchEvent) => {
    eventBus.emit('touchend', event);
  };
}

// Экспортируем синглтон
export const domEventBridge = DOMEventBridge.getInstance();
