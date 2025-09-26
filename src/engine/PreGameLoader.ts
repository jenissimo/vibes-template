import { logger } from '@/engine/logging';
import { assetManager } from './assets/AssetManager';
import { ServiceRegistry, ServiceKeys } from '@/engine/registry';
import { remoteDebugService } from '@/engine/debug';

/**
 * PreGameLoader - загрузка ресурсов ДО запуска игры
 * Включает: шрифты, конфигурацию, базовые сервисы, debug подключения
 */
export class PreGameLoader {
  private static instance: PreGameLoader | null = null;
  private isLoaded = false;

  public static getInstance(): PreGameLoader {
    if (!PreGameLoader.instance) {
      PreGameLoader.instance = new PreGameLoader();
    }
    return PreGameLoader.instance;
  }

  public static resetInstance(): void {
    PreGameLoader.instance = null;
    logger.info('🔄 PreGameLoader instance reset', { source: 'preload' });
  }

  /**
   * Загрузить все ресурсы, необходимые ДО запуска игры
   */
  public async load(): Promise<void> {
    if (this.isLoaded) {
      logger.warn('PreGameLoader уже загружен!', { source: 'preload' });
      return;
    }

    logger.info('🚀 PreGameLoader: начало загрузки...', { source: 'preload' });

    try {
      // 1. Инициализируем AssetManager
      logger.info('🎯 Инициализация AssetManager...', { source: 'preload' });
      await assetManager.initialize();
      logger.info('✅ AssetManager готов (только шрифты)', { source: 'preload' });

      // 2. Инициализируем debug сервисы
      this.initializeDebugServices();

      // 3. Регистрируем базовые сервисы
      this.registerBasicServices();

      this.isLoaded = true;
      logger.info('✅ PreGameLoader завершен!', { source: 'preload' });
    } catch (error) {
      logger.error('❌ Ошибка PreGameLoader', error as Error);
      throw error;
    }
  }

  /**
   * Инициализация debug сервисов
   */
  private async initializeDebugServices(): Promise<void> {
    const debugUrl = this.getDebugServerURL();
    
    if (debugUrl) {
      logger.info('🔍 Проверка debug сервера...', { url: debugUrl, source: 'preload' });
      const isAvailable = await this.checkWebSocketAvailability(debugUrl);
      
      if (isAvailable) {
        logger.info('✅ Debug сервер доступен, подключаемся...', { url: debugUrl, source: 'preload' });
        remoteDebugService.connect(debugUrl);
      } else {
        logger.info('⚠️ Debug сервер недоступен', { url: debugUrl, source: 'preload' });
      }
    }
  }

  /**
   * Регистрация базовых сервисов
   */
  private registerBasicServices(): void {
    logger.info('📝 Регистрация базовых сервисов...', { source: 'preload' });
    
    // AssetManager уже зарегистрирован
    ServiceRegistry.register(ServiceKeys.RemoteDebug, remoteDebugService, { replace: true });
    
    logger.info('✅ Базовые сервисы зарегистрированы', { source: 'preload' });
  }

  /**
   * Получить URL debug сервера
   */
  private getDebugServerURL(): string | null {
    if (import.meta.env.DEV) {
      const hostname = window.location.hostname;
      return `ws://${hostname}:3333`;
    }
    return import.meta.env.VITE_REMOTE_DEBUG_URL || null;
  }

  /**
   * Проверить доступность WebSocket сервера
   */
  private async checkWebSocketAvailability(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const ws = new WebSocket(url);
      const timeout = setTimeout(() => {
        ws.close();
        resolve(false);
      }, 2000);

      ws.onopen = () => {
        clearTimeout(timeout);
        ws.close();
        resolve(true);
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
    });
  }

  /**
   * Проверить, загружен ли PreGameLoader
   */
  public get loaded(): boolean {
    return this.isLoaded;
  }
}
