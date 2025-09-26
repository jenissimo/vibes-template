import * as PIXI from 'pixi.js';
import type { CacheMetrics } from '../../shared/game-types';

/**
 * LRU Cache implementation for textures
 */
class LRUCache<K, V> {
  public cache = new Map<K, V>();
  private accessOrder: K[] = [];
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.moveToEnd(key);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.set(key, value);
      this.moveToEnd(key);
    } else {
      // Add new entry
      this.cache.set(key, value);
      this.accessOrder.push(key);
      
      // Remove oldest if over limit
      if (this.cache.size > this.maxSize) {
        const oldestKey = this.accessOrder.shift()!;
        this.cache.delete(oldestKey);
      }
    }
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  size(): number {
    return this.cache.size;
  }

  private moveToEnd(key: K): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
      this.accessOrder.push(key);
    }
  }
}

/**
 * TextureCache - сервис для кеширования текстур и графики
 * Управляет LRU кешем с метриками производительности
 */
export class TextureCache {
  private textureCache: LRUCache<string, PIXI.Texture>;
  private graphicsCache: LRUCache<string, PIXI.Graphics>;
  private metrics: CacheMetrics;

  constructor(textureLimit: number = 200, graphicsLimit: number = 100) {
    this.textureCache = new LRUCache<string, PIXI.Texture>(textureLimit);
    this.graphicsCache = new LRUCache<string, PIXI.Graphics>(graphicsLimit);
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      currentSize: 0,
      maxSize: textureLimit,
      hitRate: 0
    };
  }

  /**
   * Get texture from cache
   */
  getTexture(key: string): PIXI.Texture | undefined {
    const cached = this.textureCache.get(key);
    if (cached) {
      this.metrics.hits++;
    } else {
      this.metrics.misses++;
    }
    return cached;
  }

  /**
   * Set texture in cache
   */
  setTexture(key: string, texture: PIXI.Texture): void {
    this.textureCache.set(key, texture);
  }

  /**
   * Get graphics from cache
   */
  getGraphics(key: string): PIXI.Graphics | undefined {
    return this.graphicsCache.get(key);
  }

  /**
   * Set graphics in cache
   */
  setGraphics(key: string, graphics: PIXI.Graphics): void {
    this.graphicsCache.set(key, graphics);
  }

  /**
   * Delete texture from cache
   */
  deleteTexture(key: string): boolean {
    return this.textureCache.delete(key);
  }

  /**
   * Delete graphics from cache
   */
  deleteGraphics(key: string): boolean {
    return this.graphicsCache.delete(key);
  }

  /**
   * Check if texture exists in cache
   */
  hasTexture(key: string): boolean {
    return this.textureCache.has(key);
  }

  /**
   * Check if graphics exists in cache
   */
  hasGraphics(key: string): boolean {
    return this.graphicsCache.has(key);
  }

  /**
   * Get cache metrics for monitoring
   */
  getCacheMetrics(): CacheMetrics {
    this.metrics.currentSize = this.textureCache.size();
    this.metrics.hitRate = this.metrics.hits / (this.metrics.hits + this.metrics.misses) || 0;
    return { ...this.metrics };
  }

  /**
   * Reset cache metrics
   */
  resetMetrics(): void {
    this.metrics.hits = 0;
    this.metrics.misses = 0;
    this.metrics.evictions = 0;
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.textureCache.clear();
    this.graphicsCache.clear();
    this.resetMetrics();
  }

  /**
   * Get cache size information
   */
  getCacheSize(): { textures: number; graphics: number; total: number } {
    return {
      textures: this.textureCache.size(),
      graphics: this.graphicsCache.size(),
      total: this.textureCache.size() + this.graphicsCache.size()
    };
  }

  /**
   * Set cache size limits
   */
  setCacheLimits(textureLimit: number, graphicsLimit: number): void {
    // Note: LRU cache doesn't support dynamic resizing, so we clear and recreate
    this.clearCache();
    this.textureCache = new LRUCache<string, PIXI.Texture>(textureLimit);
    this.graphicsCache = new LRUCache<string, PIXI.Graphics>(graphicsLimit);
    this.metrics.maxSize = textureLimit;
  }

  /**
   * Удаление текстур по префиксу ключа
   * Полезно для инвалидации кеша определенного типа текстур
   */
  deleteTexturesByPrefix(prefix: string): number {
    const keysToRemove: string[] = [];
    
    // Получаем все ключи кеша
    const allKeys = Array.from(this.textureCache.cache.keys());
    for (const key of allKeys) {
      if (key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    
    // Удаляем найденные ключи
    keysToRemove.forEach(key => {
      this.textureCache.delete(key);
    });
    
    return keysToRemove.length;
  }

  /**
   * Удаление графики по префиксу ключа
   */
  deleteGraphicsByPrefix(prefix: string): number {
    const keysToRemove: string[] = [];
    
    const allKeys = Array.from(this.graphicsCache.cache.keys());
    for (const key of allKeys) {
      if (key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      this.graphicsCache.delete(key);
    });
    
    return keysToRemove.length;
  }

  /**
   * Получить все ключи текстур (для отладки)
   */
  getTextureKeys(): string[] {
    return Array.from(this.textureCache.cache.keys());
  }

  /**
   * Получить все ключи графики (для отладки)
   */
  getGraphicsKeys(): string[] {
    return Array.from(this.graphicsCache.cache.keys());
  }
}
