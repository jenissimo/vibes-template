/**
 * Core Configuration System
 * Абстрактная система конфигов для геймдева
 * 
 * Архитектура:
 * - Data Tables (как в Unity Scriptable Objects)
 * - Config Manager для управления
 * - Hot-reload поддержка
 * - Валидация данных
 * - Кэширование для производительности
 */

// Простой EventEmitter для браузера
class EventEmitter {
  private listeners = new Map<string, Function[]>();

  on(event: string, listener: Function): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners || eventListeners.length === 0) {
      return false;
    }
    
    eventListeners.forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in event listener for '${event}':`, error);
      }
    });
    
    return true;
  }

  off(event: string, listener?: Function): this {
    if (!listener) {
      this.listeners.delete(event);
      return this;
    }
    
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
    
    return this;
  }
}

// Базовый интерфейс для всех конфигов
export interface IGameConfig {
  readonly id: string;
  readonly version: string;
  readonly lastModified: Date;
  readonly configType: string; // Тип конфига для фильтрации
}

// Менеджер конфигов
export class ConfigManager extends EventEmitter {
  private static instance: ConfigManager;
  private configs = new Map<string, IGameConfig>();
  private cache = new Map<string, any>();
  private validators = new Map<string, (data: any) => boolean>();

  private constructor() {
    super();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  // Регистрация конфига
  register<T extends IGameConfig>(config: T): void {
    this.configs.set(config.id, config);
    this.cache.delete(config.id); // Очищаем кэш
    this.emit('configRegistered', config);
  }

  // Получение конфига
  get<T extends IGameConfig>(id: string): T | null {
    // Проверяем кэш
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }

    const config = this.configs.get(id) as T;
    if (config) {
      this.cache.set(id, config);
    }
    return config || null;
  }

  // Получение всех конфигов определенного типа
  getAll<T extends IGameConfig>(type: string): T[] {
    const allConfigs = Array.from(this.configs.values());
    const filtered = allConfigs.filter(config => config.configType === type);
    return filtered as T[];
  }

  // Валидация конфига
  validate(id: string, data: any): boolean {
    const validator = this.validators.get(id);
    if (!validator) return true;
    return validator(data);
  }

  // Регистрация валидатора
  registerValidator(id: string, validator: (data: any) => boolean): void {
    this.validators.set(id, validator);
  }

  // Очистка кэша
  clearCache(): void {
    this.cache.clear();
    this.emit('cacheCleared');
  }

  // Hot-reload конфига
  reload<T extends IGameConfig>(id: string, newConfig: T): void {
    const oldConfig = this.configs.get(id);
    this.configs.set(id, newConfig);
    this.cache.delete(id);
    this.emit('configReloaded', { id, oldConfig, newConfig });
  }

  // Получение статистики
  getStats() {
    return {
      totalConfigs: this.configs.size,
      cachedConfigs: this.cache.size,
      validators: this.validators.size,
    };
  }
}

// Глобальный экземпляр
export const configManager = ConfigManager.getInstance();
