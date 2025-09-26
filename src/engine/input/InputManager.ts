import { Vector2 } from '@/shared/types';
import { logger } from '@/engine/logging';
import { ServiceRegistry, ServiceKeys } from '@/engine/registry';
import { CoordinateService } from '@/engine/coordinates';
import { eventBus } from '@/engine/events/EventBus';
import { withEventDispatcher } from '@/engine/events/IEventDispatcher';

/**
 * Сервис для управления вводом (мышь и тач)
 * Нормализует координаты и предоставляет единый API
 */
class InputManagerBase {
  private static instance: InputManagerBase | null = null;
  private isPointerDown = false;
  private pointerPosition: Vector2 = { x: 0, y: 0 };
  private lastPointerPosition: Vector2 = { x: 0, y: 0 };
  private pointerDelta: Vector2 = { x: 0, y: 0 };
  private canvas: HTMLCanvasElement | null = null;
  private coordinateService: CoordinateService;

  // Привязанные обработчики для правильного удаления
  private boundHandlers: {
    handlePointerDown: (e: MouseEvent) => void;
    handlePointerMove: (e: MouseEvent) => void;
    handlePointerUp: (e: MouseEvent) => void;
    handleTouchStart: (e: TouchEvent) => void;
    handleTouchMove: (e: TouchEvent) => void;
    handleTouchEnd: (e: TouchEvent) => void;
  } | null = null;

  /**
   * Инициализация менеджера ввода
   */
  constructor() {
    this.coordinateService = CoordinateService.getInstance();
    this.createBoundHandlers();
  }

  /**
   * Создание привязанных обработчиков для правильного удаления
   */
  private createBoundHandlers(): void {
    this.boundHandlers = {
      handlePointerDown: this.handlePointerDown.bind(this),
      handlePointerMove: this.handlePointerMove.bind(this),
      handlePointerUp: this.handlePointerUp.bind(this),
      handleTouchStart: this.handleTouchStart.bind(this),
      handleTouchMove: this.handleTouchMove.bind(this),
      handleTouchEnd: this.handleTouchEnd.bind(this),
    };
  }

  public static getInstance(): InstanceType<typeof InputManager> {
    if (!InputManagerBase.instance) {
      InputManagerBase.instance = new InputManagerBase();
      ServiceRegistry.register(ServiceKeys.InputManager, InputManagerBase.instance);
    }
    return InputManagerBase.instance as InstanceType<typeof InputManager>;
  }

  public static resetInstance(): void {
    if (InputManagerBase.instance) {
      InputManagerBase.instance.destroy();
      InputManagerBase.instance = null;
      ServiceRegistry.unregister(ServiceKeys.InputManager);
    }
  }

  public initialize(): void {
    logger.info('🎮 Инициализация менеджера ввода...', { source: 'game' });

    this.canvas = document.getElementById('pixi-canvas') as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error('Canvas элемент с id="pixi-canvas" не найден!');
    }

    this.setupEventListeners();
    logger.info('✅ Менеджер ввода инициализирован', { source: 'game' });
  }

  /**
   * Настройка обработчиков событий
   */
  private setupEventListeners(): void {
    if (!this.canvas || !this.boundHandlers) return;

    // События мыши
    this.canvas.addEventListener('mousedown', this.boundHandlers.handlePointerDown);
    this.canvas.addEventListener('mousemove', this.boundHandlers.handlePointerMove);
    this.canvas.addEventListener('mouseup', this.boundHandlers.handlePointerUp);
    this.canvas.addEventListener('mouseleave', this.boundHandlers.handlePointerUp);

    // События тач
    this.canvas.addEventListener('touchstart', this.boundHandlers.handleTouchStart);
    this.canvas.addEventListener('touchmove', this.boundHandlers.handleTouchMove);
    this.canvas.addEventListener('touchend', this.boundHandlers.handleTouchEnd);
    this.canvas.addEventListener('touchcancel', this.boundHandlers.handleTouchEnd);

    // Предотвращаем контекстное меню на правый клик
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /**
   * Обработка нажатия мыши
   */
  private handlePointerDown(event: MouseEvent): void {
    this.isPointerDown = true;
    this.updatePointerPosition(event.clientX, event.clientY);
    this.lastPointerPosition = { ...this.pointerPosition };
    
    logger.debug('Mouse down event', {
      position: this.pointerPosition,
      source: 'input'
    });
    
    // Отправляем событие через EventBus
    eventBus.emit('pointer-start', { position: this.pointerPosition });
  }

  /**
   * Обработка движения мыши
   */
  private handlePointerMove(event: MouseEvent): void {
    this.updatePointerPosition(event.clientX, event.clientY);
    
    // Отправляем событие движения только если указатель нажат
    if (this.isPointerDown) {
      eventBus.emit('pointer-move', { position: this.pointerPosition });
    }
  }

  /**
   * Обработка отпускания мыши
   */
  private handlePointerUp(_event: MouseEvent): void {
    this.isPointerDown = false;
    
    // Отправляем событие окончания ввода
    eventBus.emit('pointer-end');
  }

  /**
   * Обработка начала тач
   */
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length > 0) {
      logger.info(`[InputManager] Touch start: touches=${event.touches.length}, isPointerDown=${this.isPointerDown}`, { source: 'game' });
      this.isPointerDown = true;
      const touch = event.touches[0];
      this.updatePointerPosition(touch.clientX, touch.clientY);
      this.lastPointerPosition = { ...this.pointerPosition };
      
      // Отправляем событие через EventBus
      eventBus.emit('pointer-start', { position: this.pointerPosition });
    }
  }

  /**
   * Обработка движения тач
   */
  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.updatePointerPosition(touch.clientX, touch.clientY);
      
      // Отправляем событие движения только если указатель нажат
      if (this.isPointerDown) {
        eventBus.emit('pointer-move', { position: this.pointerPosition });
      }
    }
  }

  /**
   * Обработка окончания тач
   */
  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    
    // Проверяем, что это действительно окончание тача (нет активных касаний)
    if (event.touches.length === 0) {
      this.isPointerDown = false;
      
      // Отправляем событие окончания ввода
      eventBus.emit('pointer-end');
    }
  }

  /**
   * Обновление позиции указателя
   */
  private updatePointerPosition(clientX: number, clientY: number): void {
    if (!this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    this.pointerPosition = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  /**
   * Обновление менеджера ввода (вызывается каждый кадр)
   */
  public update(_deltaTime: number): void {
    // Вычисляем дельту движения
    this.pointerDelta = {
      x: this.pointerPosition.x - this.lastPointerPosition.x,
      y: this.pointerPosition.y - this.lastPointerPosition.y,
    };

    // Обновляем последнюю позицию
    this.lastPointerPosition = { ...this.pointerPosition };
  }

  /**
   * Проверить, нажат ли указатель
   */
  public isPointerPressed(): boolean {
    return this.isPointerDown;
  }

  /**
   * Получить позицию указателя
   */
  public getPointerPosition(): Vector2 {
    return { ...this.pointerPosition };
  }

  /**
   * Конвертировать canvas координаты в игровые
   * Теперь использует централизованный CoordinateService
   */
  public screenToGame(canvasX: number, canvasY: number): Vector2 {
    return this.coordinateService.screenToGame(canvasX, canvasY);
  }

  /**
   * Получить дельту движения указателя
   */
  public getPointerDelta(): Vector2 {
    return { ...this.pointerDelta };
  }

  /**
   * Проверить, был ли клик (нажатие и отпускание в одной точке)
   */
  public wasPointerClicked(): boolean {
    // Простая проверка - если дельта движения мала, считаем это кликом
    const deltaLength = Math.sqrt(
      this.pointerDelta.x * this.pointerDelta.x + 
      this.pointerDelta.y * this.pointerDelta.y
    );
    return !this.isPointerDown && deltaLength < 5; // 5 пикселей - порог для клика
  }

  // Убрали методы подписки - теперь используем EventBus напрямую

  /**
   * Очистка ресурсов
   */
  public destroy(): void {
    if (this.canvas && this.boundHandlers) {
      this.canvas.removeEventListener('mousedown', this.boundHandlers.handlePointerDown);
      this.canvas.removeEventListener('mousemove', this.boundHandlers.handlePointerMove);
      this.canvas.removeEventListener('mouseup', this.boundHandlers.handlePointerUp);
      this.canvas.removeEventListener('mouseleave', this.boundHandlers.handlePointerUp);
      this.canvas.removeEventListener('touchstart', this.boundHandlers.handleTouchStart);
      this.canvas.removeEventListener('touchmove', this.boundHandlers.handleTouchMove);
      this.canvas.removeEventListener('touchend', this.boundHandlers.handleTouchEnd);
      this.canvas.removeEventListener('touchcancel', this.boundHandlers.handleTouchEnd);
    }

    // EventBus очищается автоматически при уничтожении приложения

    this.canvas = null;
    this.boundHandlers = null;
    logger.info('🧹 Менеджер ввода очищен', { source: 'game' });
  }
}

// Экспортируем InputManager с поддержкой IEventDispatcher
export const InputManager = withEventDispatcher(InputManagerBase);
export type InputManager = InstanceType<typeof InputManager>;
