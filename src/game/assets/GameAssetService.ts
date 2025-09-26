import * as PIXI from 'pixi.js';
import { logger } from '@/engine/logging';
import { AssetLoader } from '@/engine/assets/loaders/AssetLoader';
import { SVG_PATHS } from '@/assets/svg';
import vibesSpriteUrl from '@/assets/sprites/vibes.png';
import { ITEM_ICON_URLS } from '@/assets/icons';

/**
 * Сервис для загрузки специфичных для игры ресурсов.
 * Использует универсальный AssetLoader из движка.
 */
export class GameAssetService {
  public assetLoader: AssetLoader;

  constructor(assetLoader: AssetLoader) {
    this.assetLoader = assetLoader;
  }

  /**
   * Регистрация всех игровых ресурсов.
   */
  public async registerAssets(): Promise<void> {
    // Регистрируем SVG спрайт
    this.assetLoader.registerTextureGroup(SVG_PATHS, (key) => `svg-${key}`);
    
    // Регистрируем все спрайты
    await this.registerSprites();
    
    // Регистрируем PNG иконки из папки icons/
    await this.registerItemIcons();
    
    logger.info('📋 GameAssetService: игровые ресурсы зарегистрированы', { source: 'game' });
  }

  /**
   * Загрузка всех зарегистрированных игровых текстур.
   */
  public async loadTextures(): Promise<void> {
    try {
      // Загружаем SVG спрайт
      await this.assetLoader.loadTextureGroup(SVG_PATHS, (key) => `svg-${key}`);
      
      // Загружаем все спрайты
      await this.loadSprites();

      // Загружаем PNG иконки предметов
      await this.loadItemIcons();
      
      logger.info('✅ GameAssetService: все игровые текстуры загружены!', { source: 'game' });
    } catch (error) {
      logger.error('❌ GameAssetService: Ошибка загрузки текстур:', error as Error, { source: 'game' });
      throw error;
    }
  }

  /**
   * Регистрация всех спрайтов из папки sprites/
   */
  private async registerSprites(): Promise<void> {
    // Список всех доступных спрайтов
    const sprites = [
      { name: 'vibes', url: vibesSpriteUrl }
    ];
    
    for (const sprite of sprites) {
      PIXI.Assets.add({ alias: `sprite-${sprite.name}`, src: sprite.url });
    }
    
    logger.info('📋 GameAssetService: спрайты зарегистрированы', { 
      count: sprites.length,
      sprites: sprites.map(s => s.name),
      source: 'game' 
    });
  }

  /**
   * Загрузка всех спрайтов
   */
  private async loadSprites(): Promise<void> {
    const sprites = ['vibes'];
    
    for (const spriteName of sprites) {
      await this.assetLoader.loadTexture(`sprite-${spriteName}`);
    }
  }

  /**
   * Регистрация PNG иконок предметов
   */
  private async registerItemIcons(): Promise<void> {
    // Регистрируем иконки из ITEM_ICON_URLS
    for (const [filename, url] of Object.entries(ITEM_ICON_URLS)) {
      const iconName = filename.replace('.png', '');
      PIXI.Assets.add({ alias: `item-${iconName}`, src: url });
    }
    
    logger.info('📋 GameAssetService: PNG иконки предметов зарегистрированы', { 
      count: Object.keys(ITEM_ICON_URLS).length,
      icons: Object.keys(ITEM_ICON_URLS),
      source: 'game' 
    });
  }

  /**
   * Загрузка PNG иконок предметов
   */
  private async loadItemIcons(): Promise<void> {
    for (const filename of Object.keys(ITEM_ICON_URLS)) {
      const iconName = filename.replace('.png', '');
      await this.assetLoader.loadTexture(`item-${iconName}`);
    }
  }
}
