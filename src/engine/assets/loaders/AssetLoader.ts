import * as PIXI from 'pixi.js';
import { logger } from '@/engine/logging';
import { TextureFactory } from '@game/graphics/TextureFactory';
import { FONT_FAMILIES, FontType } from '@assets/fonts/fonts';
import { getPixiFontFamily } from '@utils/fontUtils';

/**
 * Сервис для загрузки игровых ресурсов
 * Обёртка над PIXI.Assets для предзагрузки текстур, звуков и шрифтов
 */
export class AssetLoader {
  private loadedAssets = new Map<string, any>();
  private loadedFonts = new Set<string>();
  private fontPromises = new Map<string, Promise<void>>();
  private isInitialized = false;
  private _texturesLoaded = false;
  private textureFactory: TextureFactory;

  constructor() {
    this.textureFactory = TextureFactory.getInstance();
  }

  /**
   * Инициализация загрузчика ассетов (только шрифты и регистрация)
   */
  public async initialize(): Promise<void> {
    logger.info('📦 Инициализация загрузчика ассетов (шрифты)...', { source: 'game' });

    // Настройка PIXI.Assets
    PIXI.Assets.init();

    // 1. Загружаем шрифты (должны быть первыми)
    await this.loadFonts();

    this.isInitialized = true;
    logger.info('✅ AssetLoader инициализирован (только шрифты)!', { source: 'game' });
  }

  /**
   * Загрузка текстур (вызывается после инициализации рендерера)
   */
  public async loadTextures(): Promise<void> {
    if (this._texturesLoaded) {
      logger.warn('Текстуры уже загружены!', { source: 'game' });
      return;
    }

    logger.info('🎨 AssetLoader: Загрузка текстур начата внешним сервисом...', { source: 'game' });

    // Сама загрузка теперь выполняется GameAssetService
    // Этот метод теперь в основном для отметки, что загрузка завершена
  }

  public completeTextureLoading(): void {
    this._texturesLoaded = true;
    logger.info('✅ AssetLoader: Загрузка текстур завершена!', { source: 'game' });
  }

  /**
   * Загрузка шрифтов
   */
  private async loadFonts(): Promise<void> {
    logger.info('🔤 Загрузка шрифтов...', { source: 'game' });

    // Загружаем CSS с шрифтами
    await this.loadFontCSS();
    
    // Ждем загрузки шрифтов
    await this.waitForFonts();
    
    logger.info('✅ Шрифты загружены', { source: 'game' });
  }

  /**
   * Загрузить CSS файл с шрифтами
   */
  private async loadFontCSS(): Promise<void> {
    // Проверяем, не загружен ли уже CSS
    if (document.querySelector('link[data-fonts="true"]')) {
      logger.info('📝 Font CSS уже загружен', { source: 'game' });
      return;
    }

    let fontsCssUrl: string | null = null;
    try {
      const module = await import('@/assets/fonts/fonts.css?url');
      fontsCssUrl = module.default;
    } catch (error) {
      logger.warn('⚠️ Не удалось получить URL fonts.css', { source: 'game', error });
      return;
    }

    if (!fontsCssUrl) {
      logger.warn('⚠️ fonts.css URL пустой, пропускаем загрузку', { source: 'game' });
      return;
    }

    await new Promise<void>((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = fontsCssUrl as string;
      link.crossOrigin = 'anonymous';
      link.dataset.fonts = 'true';

      link.onload = () => {
        logger.info('📝 Font CSS загружен', { source: 'game' });
        // Даем время браузеру обработать CSS
        setTimeout(resolve, 100);
      };

      link.onerror = () => {
        logger.warn('⚠️ Не удалось загрузить font CSS, используем fallback', { source: 'game' });
        resolve(); // Продолжаем даже если не удалось загрузить
      };

      document.head.appendChild(link);
    });
  }

  /**
   * Ждать загрузки всех шрифтов
   */
  private async waitForFonts(): Promise<void> {
    const fontFamilies = Object.values(FONT_FAMILIES).map(family => family.split(',')[0].replace(/['"]/g, ''));
    
    logger.info('🔤 Загружаем шрифты:', { fontFamilies, source: 'game' });
    
    const promises = fontFamilies.map(family => this.waitForFont(family));
    const results = await Promise.allSettled(promises);
    
    // Логируем результаты
    results.forEach((result, index) => {
      const fontFamily = fontFamilies[index];
      if (result.status === 'fulfilled') {
        logger.info(`✅ ${fontFamily} загружен успешно`, { source: 'game' });
      } else {
        logger.warn(`⚠️ ${fontFamily} не удалось загрузить:`, { error: result.reason, source: 'game' });
      }
    });
  }

  /**
   * Ждать загрузки конкретного шрифта
   */
  private async waitForFont(fontFamily: string): Promise<void> {
    if (this.loadedFonts.has(fontFamily)) {
      return;
    }

    if (this.fontPromises.has(fontFamily)) {
      return this.fontPromises.get(fontFamily)!;
    }

    const promise = this.waitForFontInternal(fontFamily);
    this.fontPromises.set(fontFamily, promise);
    
    try {
      await promise;
      this.loadedFonts.add(fontFamily);
      //logger.info(`✅ Шрифт загружен: ${fontFamily}`, { source: 'game' });
    } catch (error) {
      logger.warn(`⚠️ Шрифт не загружен: ${fontFamily}`, { error, source: 'game' });
      this.loadedFonts.add(fontFamily); // Добавляем чтобы не пытаться снова
    }

    return promise;
  }

  /**
   * Внутреннее ожидание загрузки шрифта
   */
  private async waitForFontInternal(fontFamily: string): Promise<void> {
    return new Promise((resolve) => {
      // Проверяем, загружен ли шрифт
      if (this.isFontActuallyLoaded(fontFamily)) {
        resolve();
        return;
      }

      // Ждем загрузки шрифта с таймаутом
      let attempts = 0;
      const maxAttempts = 50; // 2.5 секунды максимум

      const checkFont = () => {
        attempts++;
        
        if (this.isFontActuallyLoaded(fontFamily)) {
          resolve();
          return;
        }

        if (attempts >= maxAttempts) {
          logger.warn(`Timeout waiting for font: ${fontFamily}`, { source: 'game' });
          resolve(); // Продолжаем с fallback
          return;
        }

        requestAnimationFrame(checkFont);
      };

      checkFont();
    });
  }

  /**
   * Проверяем, действительно ли шрифт загружен
   */
  private isFontActuallyLoaded(fontFamily: string): boolean {
    // Способ 1: через document.fonts.check
    if (document.fonts && document.fonts.check) {
      try {
        if (document.fonts.check(`16px "${fontFamily}"`)) {
          return true;
        }
      } catch (error) {
        // Игнорируем ошибки FontFaceSet
      }
    }

    // Способ 2: через создание временного элемента
    try {
      const testElement = document.createElement('span');
      testElement.style.fontFamily = `"${fontFamily}", monospace`;
      testElement.style.fontSize = '16px';
      testElement.style.position = 'absolute';
      testElement.style.visibility = 'hidden';
      testElement.textContent = 'Test';
      
      document.body.appendChild(testElement);
      
      const computedStyle = window.getComputedStyle(testElement);
      const actualFont = computedStyle.fontFamily;
      
      document.body.removeChild(testElement);
      
      // Проверяем, что браузер использует наш шрифт, а не fallback
      return actualFont.includes(fontFamily);
    } catch (error) {
      // Если что-то пошло не так, считаем что шрифт не загружен
      return false;
    }
  }

  /**
   * Регистрация группы текстур
   */
  public registerTextureGroup(
    assetPaths: Record<string, string>,
    assetNameMapper: (key: string) => string
  ): void {
    for (const [key, path] of Object.entries(assetPaths)) {
      PIXI.Assets.add({ alias: assetNameMapper(key), src: path });
    }
  }

  /**
   * Загрузка одной текстуры
   */
  public async loadTexture(assetName: string): Promise<PIXI.Texture | null> {
    if (this.loadedAssets.has(assetName)) {
      return this.loadedAssets.get(assetName);
    }
    try {
      const texture = await PIXI.Assets.load(assetName);
      this.loadedAssets.set(assetName, texture);
      return texture;
    } catch (error) {
      logger.warn('⚠️ Не удалось загрузить текстуру', { asset: assetName, source: 'game' });
      return null;
    }
  }


  /**
   * Загрузка группы ресурсов
   */
  public async loadTextureGroup(
    assetPaths: Record<string, string>, 
    assetNameMapper: (key: string) => string
  ): Promise<void> {
    for (const [key] of Object.entries(assetPaths)) {
      const asset = assetNameMapper(key);
      await this.loadTexture(asset);
    }
  }

  /**
   * Получить загруженный ресурс
   */
  public getAsset<T = any>(name: string): T | null {
    if (!this.isInitialized) {
      logger.warn('AssetLoader не инициализирован!', { source: 'game' });
      return null;
    }

    return this.loadedAssets.get(name) || null;
  }

  /**
   * Проверить, загружен ли ресурс
   */
  public hasAsset(name: string): boolean {
    return this.loadedAssets.has(name);
  }

  /**
   * Получить все загруженные ресурсы
   */
  public getAllAssets(): Map<string, any> {
    return new Map(this.loadedAssets);
  }

  /**
   * Проверить, инициализирован ли загрузчик
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




  // ===== FONT API =====

  /**
   * Получить CSS-совместимое имя шрифта
   */
  public getFontFamily(fontType: FontType): string {
    const fontFamily = FONT_FAMILIES[fontType];
    
    // Если шрифт не загружен, возвращаем fallback
    const primaryFont = fontFamily.split(',')[0].replace(/['"]/g, '');
    if (!this.isFontLoaded(primaryFont)) {
      logger.warn(`⚠️ Шрифт ${primaryFont} не загружен, используем fallback`, { source: 'game' });
    }
    
    return fontFamily;
  }

  /**
   * Получить PixiJS-совместимое имя шрифта
   */
  public getPixiFontFamily(fontType: FontType): string {
    return getPixiFontFamily(fontType);
  }

  /**
   * Проверить, загружен ли шрифт
   */
  public isFontLoaded(fontFamily: string): boolean {
    return this.loadedFonts.has(fontFamily);
  }

  /**
   * Получить статистику загруженных шрифтов
   */
  public getFontStats(): { loaded: number; total: number; fonts: string[] } {
    const totalFonts = Object.values(FONT_FAMILIES).length;
    return {
      loaded: this.loadedFonts.size,
      total: totalFonts,
      fonts: Array.from(this.loadedFonts)
    };
  }

  // ===== UNIFIED API =====

  /**
   * Получить ресурс по имени (универсальный метод)
   * Сначала ищет в текстурах, потом в шрифтах
   */
  public getResource<T = any>(name: string): T | null {
    // Сначала пробуем AssetLoader
    const asset = this.getAsset<T>(name);
    if (asset) {
      return asset;
    }

    // Если не найден, пробуем как шрифт
    if (this.isFontLoaded(name)) {
      return this.getFontFamily(name as FontType) as T;
    }

    return null;
  }

  /**
   * Проверить, загружен ли ресурс (универсальный метод)
   */
  public hasResource(name: string): boolean {
    return this.hasAsset(name) || this.isFontLoaded(name);
  }

  /**
   * Получить общую статистику ресурсов
   */
  public getResourceStats(): {
    textures: number;
    fonts: number;
    total: number;
    isInitialized: boolean;
  } {
    const fontStats = this.getFontStats();
    
    return {
      textures: this.loadedAssets.size,
      fonts: fontStats.loaded,
      total: this.loadedAssets.size + fontStats.loaded,
      isInitialized: this.isInitialized
    };
  }

  /**
   * Очистка ресурсов
   */
  public destroy(): void {
    this.loadedAssets.clear();
    this.loadedFonts.clear();
    this.fontPromises.clear();
    this.textureFactory.clearCache();
    PIXI.Assets.reset();
    this.isInitialized = false;
    logger.info('🧹 Загрузчик ассетов очищен', { source: 'game' });
  }
}
