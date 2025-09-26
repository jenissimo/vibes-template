/**
 * Game Event Bus для игровых событий
 * Отделен от системного EventBus движка
 */

export type GameEventHandler<T = any> = (data: T) => void;

export type GameEventHandlerWithOwner<T = any> = {
  owner: any;
  handler: GameEventHandler<T>;
};

/**
 * Типизированные игровые события
 */
export interface GameEvents {
  'mode-click': { modeId: string };
  'add-credits': { amount: number };
  'settings-open': void;
  'settings-close': void;
}

export class GameEventBus {
  private static instance: GameEventBus;
  private handlers = new Map<string, Set<GameEventHandler>>();
  private handlersWithOwner = new Map<string, Set<GameEventHandlerWithOwner>>();

  private constructor() {}

  public static getInstance(): GameEventBus {
    if (!GameEventBus.instance) {
      GameEventBus.instance = new GameEventBus();
    }
    return GameEventBus.instance;
  }

  /**
   * Подписаться на игровое событие
   */
  public on<K extends keyof GameEvents>(event: K, handler: GameEventHandler<GameEvents[K]>): () => void {
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
   * Подписаться на игровое событие с владельцем
   */
  public onWithOwner<K extends keyof GameEvents>(
    owner: any, 
    event: K, 
    handler: GameEventHandler<GameEvents[K]>
  ): () => void {
    if (!this.handlersWithOwner.has(event)) {
      this.handlersWithOwner.set(event, new Set());
    }
    
    const handlerWithOwner: GameEventHandlerWithOwner<GameEvents[K]> = { owner, handler };
    this.handlersWithOwner.get(event)!.add(handlerWithOwner);
    
    // Возвращаем функцию отписки
    return () => {
      this.handlersWithOwner.get(event)?.delete(handlerWithOwner);
    };
  }

  /**
   * Отправить игровое событие
   */
  public emit<K extends keyof GameEvents>(event: K, data?: GameEvents[K]): void {
    // Обрабатываем обычные обработчики
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      for (const handler of eventHandlers) {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in game event handler for ${event}:`, error);
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
          console.error(`Error in game event handler with owner for ${event}:`, error);
        }
      }
    }
  }

  /**
   * Отписаться от игрового события
   */
  public off<K extends keyof GameEvents>(event: K, handler: GameEventHandler<GameEvents[K]>): void {
    this.handlers.get(event)?.delete(handler);
  }

  /**
   * Отписаться от игрового события по владельцу и обработчику
   */
  public offWithOwner<K extends keyof GameEvents>(
    owner: any, 
    event: K, 
    handler: GameEventHandler<GameEvents[K]>
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
   * Отписаться от всех игровых событий владельца
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
   * Очистить все обработчики игровых событий
   */
  public clear(): void {
    this.handlers.clear();
    this.handlersWithOwner.clear();
  }
}

// Экспортируем синглтон
export const gameEventBus = GameEventBus.getInstance();
