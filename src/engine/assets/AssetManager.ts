import { logger } from '@/engine/logging';
import { AssetLoader } from './loaders/AssetLoader';
import { ServiceRegistry, ServiceKeys } from '@/engine/registry';

/**
 * AssetManager - единая точка управления всеми ассетами
 * Теперь AssetLoader сам управляет всеми типами ассетов (текстуры, шрифты, звуки)
 */
export class AssetManager {
  private static instance: AssetManager | null = null;
  public loader!: AssetLoader;
  private isInitialized = false;
  private _texturesLoaded = false;

  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  /**
   * Инициализация AssetManager (только шрифты)
   * Загружает шрифты и регистрирует базовые ресурсы
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('AssetManager уже инициализирован!', { source: 'assets' });
      return;
    }

    logger.info('🎯 AssetManager: начало инициализации (шрифты)...', { source: 'assets' });

    try {
      // 1. Инициализация AssetLoader (только шрифты)
      logger.info('📦 Инициализация AssetLoader...', { source: 'assets' });
      this.loader = new AssetLoader();
      await this.loader.initialize();
      logger.info('✅ AssetLoader готов (шрифты)', { source: 'assets' });

      // 2. Регистрация в ServiceRegistry
      this.registerServices();

      this.isInitialized = true;
      logger.info('✅ AssetManager инициализирован!', { source: 'assets' });
    } catch (error) {
      logger.error('❌ Ошибка инициализации AssetManager', error as Error);
      throw error;
    }
  }

  /**
   * Загрузка текстур (вызывается после инициализации рендерера)
   */
  public async loadTextures(): Promise<void> {
    if (this._texturesLoaded) {
      logger.warn('Текстуры уже загружены!', { source: 'assets' });
      return;
    }

    if (!this.isInitialized) {
      throw new Error('AssetManager должен быть инициализирован перед загрузкой текстур!');
    }

    logger.info('🎨 AssetManager: загрузка текстур...', { source: 'assets' });

    try {
      await this.loader.loadTextures();
      this._texturesLoaded = true;
      logger.info('✅ Текстуры загружены!', { source: 'assets' });
    } catch (error) {
      logger.error('❌ Ошибка загрузки текстур', error as Error);
      throw error;
    }
  }

  /**
   * Регистрация сервисов в ServiceRegistry
   */
  private registerServices(): void {
    ServiceRegistry.register(ServiceKeys.AssetLoader, this.loader, { replace: true });
    ServiceRegistry.register(ServiceKeys.AssetManager, this, { replace: true });
    
    logger.info('📋 AssetManager сервисы зарегистрированы', { source: 'assets' });
  }

  // ===== FONT API =====

  /**
   * Получить CSS-совместимое имя шрифта
   */
  public getFontFamily(fontType: import('@assets/fonts/fonts').FontType): string {
    this.ensureInitialized();
    return this.loader.getFontFamily(fontType);
  }

  /**
   * Получить PixiJS-совместимое имя шрифта
   */
  public getPixiFontFamily(fontType: import('@assets/fonts/fonts').FontType): string {
    this.ensureInitialized();
    return this.loader.getPixiFontFamily(fontType);
  }

  /**
   * Проверить, загружен ли шрифт
   */
  public isFontLoaded(fontFamily: string): boolean {
    this.ensureInitialized();
    return this.loader.isFontLoaded(fontFamily);
  }

  // ===== ASSET API =====

  /**
   * Получить загруженный ресурс
   */
  public getAsset<T = any>(name: string): T | null {
    this.ensureInitialized();
    return this.loader.getAsset<T>(name);
  }

  /**
   * Проверить, загружен ли ресурс
   */
  public hasAsset(name: string): boolean {
    this.ensureInitialized();
    return this.loader.hasAsset(name);
  }

  /**
   * Получить все загруженные ресурсы
   */
  public getAllAssets(): Map<string, any> {
    this.ensureInitialized();
    return this.loader.getAllAssets();
  }

  // ===== UNIFIED API =====

  /**
   * Получить ресурс по имени (универсальный метод)
   * Сначала ищет в текстурах, потом в шрифтах
   */
  public getResource<T = any>(name: string): T | null {
    this.ensureInitialized();
    return this.loader.getResource<T>(name);
  }

  /**
   * Проверить, загружен ли ресурс (универсальный метод)
   */
  public hasResource(name: string): boolean {
    this.ensureInitialized();
    return this.loader.hasResource(name);
  }

  /**
   * Получить статистику загруженных ресурсов
   */
  public getStats(): {
    textures: number;
    fonts: number;
    total: number;
    isInitialized: boolean;
  } {
    this.ensureInitialized();
    return this.loader.getResourceStats();
  }

  /**
   * Очистка всех ресурсов
   */
  public destroy(): void {
    if (this.loader) {
      this.loader.destroy();
    }
    
    this.isInitialized = false;
    logger.info('🧹 AssetManager очищен', { source: 'assets' });
  }

  /**
   * Проверить, инициализирован ли менеджер
   */
  public get initialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Проверить, загружены ли текстуры
   */
  public get texturesLoaded(): boolean {
    return this._texturesLoaded;
  }

  /**
   * Получить прямой доступ к AssetLoader
   */
  public get assetLoader(): AssetLoader {
    this.ensureInitialized();
    return this.loader;
  }

  /**
   * Проверка инициализации
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('AssetManager не инициализирован! Вызовите initialize() сначала.');
    }
  }
}

export const assetManager = AssetManager.getInstance();
