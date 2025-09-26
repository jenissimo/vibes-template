/**
 * Event Bus для коммуникации между системами
 * Позволяет системам общаться без прямых зависимостей
 */

export type EventHandler<T = any> = (data: T) => void;

export type EventHandlerWithOwner<T = any> = {
  owner: any;
  handler: EventHandler<T>;
};

/**
 * Типизированные события приложения
 */
export interface AppEvents {
  // Window события
  'window-resize': Event;
  'window-error': ErrorEvent;
  'window-unhandledrejection': PromiseRejectionEvent;
  
  // Document события
  'keydown': KeyboardEvent;
  'dblclick': MouseEvent;
  'wheel': WheelEvent;
  
  // Mouse/Touch события
  'mousedown': MouseEvent;
  'mousemove': MouseEvent;
  'touchmove': TouchEvent;
  'mouseup': MouseEvent;
  'touchend': TouchEvent;
  
  // Нормализованные события ввода (через InputManager)
  'pointer-start': { position: { x: number; y: number } };
  'pointer-move': { position: { x: number; y: number } };
  'pointer-end': void;
  
  // Системные события движка
  'gameui-ready': void;
  'app-ready': void;
  'pixi-resize': {
    layout: any;
    gameWidth: number;
    gameHeight: number;
    scale: number;
    scaleUI: number;
    safe: any;
  };
  
  // Аудио события движка
  'audio-config-changed': { config: any };
  
  // События профиля/настроек
  'profile-changed': { profile: any };
  'profile-reset': void;
  'game-assets-loaded': void;
}

export class EventBus {
  private static instance: EventBus;
  private handlers = new Map<string, Set<EventHandler>>();
  private handlersWithOwner = new Map<string, Set<EventHandlerWithOwner>>();

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Подписаться на событие
   */
  public on<K extends keyof AppEvents>(event: K, handler: EventHandler<AppEvents[K]>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    
    this.handlers.get(event)!.add(handler);
    
    // Возвращаем функцию отписки
    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  /**
   * Подписаться на событие с владельцем (для автоматической отписки)
   */
  public onWithOwner<K extends keyof AppEvents>(
    owner: any, 
    event: K, 
    handler: EventHandler<AppEvents[K]>
  ): () => void {
    if (!this.handlersWithOwner.has(event)) {
      this.handlersWithOwner.set(event, new Set());
    }
    
    const handlerWithOwner: EventHandlerWithOwner<AppEvents[K]> = { owner, handler };
    this.handlersWithOwner.get(event)!.add(handlerWithOwner);
    
    // Возвращаем функцию отписки
    return () => {
      this.handlersWithOwner.get(event)?.delete(handlerWithOwner);
    };
  }

  /**
   * Отправить событие
   */
  public emit<K extends keyof AppEvents>(event: K, data?: AppEvents[K]): void {
    // Обрабатываем обычные обработчики
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      for (const handler of eventHandlers) {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      }
    }

    // Обрабатываем обработчики с владельцами
    const eventHandlersWithOwner = this.handlersWithOwner.get(event);
    if (eventHandlersWithOwner) {
      for (const { handler } of eventHandlersWithOwner) {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler with owner for ${event}:`, error);
        }
      }
    }
  }

  /**
   * Отписаться от всех событий
   */
  public off<K extends keyof AppEvents>(event: K, handler: EventHandler<AppEvents[K]>): void {
    this.handlers.get(event)?.delete(handler);
  }

  /**
   * Отписаться от события по владельцу и обработчику
   */
  public offWithOwner<K extends keyof AppEvents>(
    owner: any, 
    event: K, 
    handler: EventHandler<AppEvents[K]>
  ): void {
    const eventHandlers = this.handlersWithOwner.get(event);
    if (!eventHandlers) return;

    for (const handlerWithOwner of eventHandlers) {
      if (handlerWithOwner.owner === owner && handlerWithOwner.handler === handler) {
        eventHandlers.delete(handlerWithOwner);
        break;
      }
    }
  }

  /**
   * Подписаться на событие один раз (автоматически отписывается после первого вызова)
   */
  public once<K extends keyof AppEvents>(event: K, handler: EventHandler<AppEvents[K]>): void {
    const onceHandler = (data: AppEvents[K]) => {
      this.off(event, onceHandler);
      handler(data);
    };
    this.on(event, onceHandler);
  }

  /**
   * Отписаться от всех событий владельца
   */
  public offAllForOwner(owner: any): void {
    for (const [, handlers] of this.handlersWithOwner) {
      for (const handlerWithOwner of handlers) {
        if (handlerWithOwner.owner === owner) {
          handlers.delete(handlerWithOwner);
        }
      }
    }
  }

  /**
   * Очистить все обработчики
   */
  public clear(): void {
    this.handlers.clear();
    this.handlersWithOwner.clear();
  }
}

// Экспортируем синглтон
export const eventBus = EventBus.getInstance();
