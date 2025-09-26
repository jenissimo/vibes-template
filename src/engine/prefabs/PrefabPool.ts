// engine/prefabs/PrefabPool.ts
import { GameObject } from '../GameObject';
import type { Scene } from '../scene/Scene';

/**
 * Пул для переиспользования GameObject
 * Оптимизирует производительность за счет переиспользования объектов
 */
export class PrefabPool<T extends GameObject = GameObject> {
  private pool: T[] = [];
  private activeObjects = new Set<T>();
  private createFn: () => T;
  private resetFn?: (obj: T) => void;
  private scene?: Scene;

  constructor(
    createFn: () => T,
    resetFn?: (obj: T) => void,
    initialSize: number = 10
  ) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    
    // Предзаполняем пул
    for (let i = 0; i < initialSize; i++) {
      const obj = this.createFn();
      obj.setActive(false);
      this.pool.push(obj);
    }
  }

  /**
   * Получить объект из пула или создать новый
   */
  get(): T {
    let obj: T;
    
    if (this.pool.length > 0) {
      obj = this.pool.pop()!;
    } else {
      obj = this.createFn();
    }
    
    // Сбрасываем состояние объекта
    if (this.resetFn) {
      this.resetFn(obj);
    }
    
    obj.setActive(true);
    this.activeObjects.add(obj);
    
    return obj;
  }

  /**
   * Вернуть объект в пул
   */
  release(obj: T): void {
    if (!this.activeObjects.has(obj)) {
      console.warn('Объект не был активен в пуле:', obj.name);
      return;
    }
    
    // Удаляем из сцены если она есть
    if (this.scene && obj.scene) {
      obj.scene.remove(obj);
    }
    
    // Сбрасываем состояние
    obj.setActive(false);
    obj.x = 0;
    obj.y = 0;
    obj.rotation = 0;
    obj.scale = 1;
    
    // Сбрасываем компоненты если есть функция сброса
    if (this.resetFn) {
      this.resetFn(obj);
    }
    
    this.activeObjects.delete(obj);
    this.pool.push(obj);
  }

  /**
   * Установить сцену для автоматического управления объектами
   */
  setScene(scene: Scene): void {
    this.scene = scene;
  }

  /**
   * Получить количество активных объектов
   */
  getActiveCount(): number {
    return this.activeObjects.size;
  }

  /**
   * Получить количество объектов в пуле
   */
  getPoolSize(): number {
    return this.pool.length;
  }

  /**
   * Очистить пул и уничтожить все объекты
   */
  destroy(): void {
    // Удаляем все активные объекты
    for (const obj of this.activeObjects) {
      if (this.scene && obj.scene) {
        obj.scene.remove(obj);
      }
    }
    
    // Очищаем пулы
    this.pool.length = 0;
    this.activeObjects.clear();
  }

  /**
   * Добавить объект в пул с автоматическим управлением жизненным циклом
   */
  spawn(config?: (obj: T) => void): T {
    const obj = this.get();
    
    if (config) {
      config(obj);
    }
    
    if (this.scene) {
      this.scene.add(obj);
    }
    
    return obj;
  }

  /**
   * Создать таймер для автоматического возврата объекта в пул
   */
  scheduleRelease(obj: T, delay: number): void {
    setTimeout(() => {
      this.release(obj);
    }, delay * 1000);
  }
}
