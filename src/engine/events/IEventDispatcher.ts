// engine/events/IEventDispatcher.ts
import { eventBus } from './EventBus';

/**
 * Интерфейс для объектов, которые могут работать с событиями
 */
export interface IEventDispatcher {
  /**
   * Подписаться на событие с автоматической отпиской и bind(this)
   */
  on<K extends keyof import('@/engine/events/EventBus').AppEvents>(
    event: K, 
    handler: import('@/engine/events/EventBus').EventHandler<import('@/engine/events/EventBus').AppEvents[K]>
  ): () => void;

  /**
   * Отписаться от события
   */
  off<K extends keyof import('@/engine/events/EventBus').AppEvents>(
    event: K, 
    handler: import('@/engine/events/EventBus').EventHandler<import('@/engine/events/EventBus').AppEvents[K]>
  ): void;

  /**
   * Отправить событие
   */
  emit<K extends keyof import('@/engine/events/EventBus').AppEvents>(
    event: K, 
    data?: import('@/engine/events/EventBus').AppEvents[K]
  ): void;

  /**
   * Отписаться от всех событий этого объекта
   */
  offAll(): void;
}

/**
 * Миксин для добавления функциональности событий к любому классу
 */
export function withEventDispatcher<T extends new (...args: any[]) => any>(Base: T) {
  return class extends Base implements IEventDispatcher {
    on<K extends keyof import('@/engine/events/EventBus').AppEvents>(
      event: K, 
      handler: import('@/engine/events/EventBus').EventHandler<import('@/engine/events/EventBus').AppEvents[K]>
    ): () => void {
      return eventBus.onWithOwner(this, event, handler.bind(this));
    }

    off<K extends keyof import('@/engine/events/EventBus').AppEvents>(
      event: K, 
      handler: import('@/engine/events/EventBus').EventHandler<import('@/engine/events/EventBus').AppEvents[K]>
    ): void {
      eventBus.offWithOwner(this, event, handler);
    }

    emit<K extends keyof import('@/engine/events/EventBus').AppEvents>(
      event: K, 
      data?: import('@/engine/events/EventBus').AppEvents[K]
    ): void {
      eventBus.emit(event, data);
    }

    offAll(): void {
      eventBus.offAllForOwner(this);
    }
  };
}
