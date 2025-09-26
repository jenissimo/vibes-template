// game/scenes/components/SVGSpriteComponent.ts
import { PixiSpriteRenderer, SpriteRendererConfig } from '@/engine/components';
import { TextureFactory } from '@/game/graphics/TextureFactory';
import { logger } from '@/engine/logging';
import * as PIXI from 'pixi.js';

export interface SVGSpriteConfig extends SpriteRendererConfig {
  svgPath: string;
  size: number;
}

export class SVGSpriteComponent extends PixiSpriteRenderer {
  private textureFactory: TextureFactory;
  private svgPath: string;
  private size: number;
  private isLoaded: boolean = false;

  constructor(container: PIXI.Container, config: SVGSpriteConfig) {
    // Передаем весь конфиг в базовый класс
    super(container, config);
    
    this.textureFactory = TextureFactory.getInstance();
    this.svgPath = config.svgPath;
    this.size = config.size;
    
    // Загружаем SVG текстуру асинхронно
    this.loadSVGTexture();
  }

  onAdded() {
    super.onAdded();
  }

  private async loadSVGTexture(): Promise<void> {
    try {
      const texture = await this.textureFactory.loadSVGTexture(this.svgPath, this.size);
      
      if (this.sprite) {
        this.sprite.texture = texture;
        this.isLoaded = true;
        
        // Применяем тинт и альфу после загрузки
        if (this.sprite.tint !== undefined) {
          this.sprite.tint = this.sprite.tint; // Принудительно обновляем
        }
        if (this.sprite.alpha !== undefined) {
          this.sprite.alpha = this.sprite.alpha;
        }
      } else {
        logger.warn('⚠️ Sprite не найден при загрузке SVG', { 
          svgPath: this.svgPath,
          source: 'svg-sprite' 
        });
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('❌ Ошибка загрузки SVG текстуры', err, { 
        svgPath: this.svgPath,
        source: 'svg-sprite' 
      });
    }
  }

  /**
   * Установить новый SVG путь и перезагрузить текстуру
   */
  public async setSVGPath(svgPath: string, size?: number): Promise<void> {
    this.svgPath = svgPath;
    if (size) {
      this.size = size;
    }
    this.isLoaded = false;
    await this.loadSVGTexture();
  }

  /**
   * Проверить, загружена ли текстура
   */
  public isTextureLoaded(): boolean {
    return this.isLoaded;
  }
}
