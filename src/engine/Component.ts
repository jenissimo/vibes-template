// engine/Component.ts
import { IEventDispatcher, eventBus } from '@/engine/events';
import type { GameObject } from './GameObject';
import { Scene } from './scene';

export abstract class Component implements IEventDispatcher {
  gameObject!: GameObject; // GameObject - избегаем циклической зависимости
  scene!: Scene;
  
  onAdded(): void {}
  onRemoved(): void {}
  update(_deltaTime: number): void {}

  // Реализация IEventDispatcher
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
}
