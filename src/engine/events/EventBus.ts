/**
 * Event Bus для коммуникации между системами
 * Позволяет системам общаться без прямых зависимостей
 */

import { logger } from '../logging';
import type { LayoutResult, Rect } from '../render/LayoutEngine';
import type { AudioConfig } from '../audio/AudioTypes';
import type { PlayerProfile } from '@/stores/game/profile';

export type EventHandler<T = any> = (data: T) => void;

export type EventHandlerWithOwner<T = any> = {
  owner: object;
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
    layout: LayoutResult;
    gameWidth: number;
    gameHeight: number;
    scale: number;
    scaleUI: number;
    safe: Rect;
  };

  // Аудио события движка
  'audio-config-changed': { config: AudioConfig };

  // События профиля/настроек
  'profile-changed': { profile: PlayerProfile };
  'profile-reset': void;
  'game-assets-loaded': void;

  // Gesture события
  'gesture-tap': { position: { x: number; y: number } };
  'gesture-double-tap': { position: { x: number; y: number } };
  'gesture-long-press': { position: { x: number; y: number } };
  'gesture-swipe': {
    direction: 'left' | 'right' | 'up' | 'down';
    velocity: number;
    distance: number;
    startPosition: { x: number; y: number };
    endPosition: { x: number; y: number };
  };

  // Игровые события (унифицированы из GameEventBus)
  'mode-click': { modeId: string };
  'add-credits': { amount: number };
  'settings-open': void;
  'settings-close': void;

  // WebGL context (emitted by PixiRenderer, consumed by Game/AudioManager)
  'webgl-context-lost': void;
  'webgl-context-restored': void;

  // Monetization — audio/ticker integration (emitted by AdService, consumed by Game/AudioManager)
  'ad-will-show': void;
  'ad-did-dismiss': void;

  // Monetization — ad lifecycle (analytics hooks)
  'ad-started': { adType: 'rewarded' | 'interstitial'; placement: string; rewardType?: string };
  'ad-completed': { adType: 'rewarded' | 'interstitial'; placement: string; rewardType?: string };
  'ad-revenue': { adType: string; placement: string; revenue: number; network: string };

  // Monetization — privacy (Settings UI → MonetizationService)
  'open-privacy-options': void;

  // IAP — purchase intents (UI → handler)
  'purchase-no-ads': void;
  'restore-purchases': void;

  // IAP — results (handler → UI feedback)
  'purchase-result': { success: boolean; cancelled?: boolean; error?: string };
  'restore-result': { success: boolean; message: 'restored' | 'nothing' | 'error' };

  // Localization
  'locale-changed': { locale: string };
}

// Symbol key ensures a single EventBus even if module is loaded twice via Vite alias duplication
const GLOBAL_KEY = Symbol.for('__vibes_eventbus__');

export class EventBus {
  private static instance: EventBus;
  private handlers = new Map<string, Set<EventHandler>>();
  private handlersWithOwner = new Map<string, Set<EventHandlerWithOwner>>();

  private constructor() {}

  public static getInstance(): EventBus {
    // Survive Vite module duplication from overlapping path aliases
    const g = globalThis as unknown as Record<symbol, EventBus | undefined>;
    const existing = g[GLOBAL_KEY];
    if (existing) return existing;

    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    g[GLOBAL_KEY] = EventBus.instance;
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
    owner: object,
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
          logger.error(`Event handler failed`, error as Error, { event });
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
          logger.error(`Event handler failed`, error as Error, { event });
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
    owner: object,
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
  public offAllForOwner(owner: object): void {
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
