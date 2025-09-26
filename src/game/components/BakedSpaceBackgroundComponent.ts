import { PixiSpriteRenderer, type SpriteRendererConfig } from '@/engine/components/PixiSpriteRenderer';
import * as PIXI from 'pixi.js';
import { bakeSpaceBackground } from '../graphics/utils/bakeSpaceBackground';
import type { SpaceBackgroundConfig, SpaceMood } from './SpaceBackgroundComponent';
import { SPACE_PRESETS } from './SpaceBackgroundComponent';
import { logger } from '@/engine/logging';

export type BakedSpaceBackgroundConfig = SpaceBackgroundConfig & {
  mood?: SpaceMood;
  renderer: PIXI.Renderer;
};

export class BakedSpaceBackgroundComponent extends PixiSpriteRenderer {
  private readonly _renderer: PIXI.Renderer;
  private _config: SpaceBackgroundConfig & { mood?: SpaceMood };

  constructor(container: PIXI.Container, config: BakedSpaceBackgroundConfig) {
    const { renderer } = config;
    const width = config.width ?? renderer.width;
    const height = config.height ?? renderer.height;

    const moodConfig = config.mood ? SPACE_PRESETS[config.mood] : {};
    const finalConfig = { ...config, ...moodConfig };

    const backgroundTexture = bakeSpaceBackground(renderer, width, height, finalConfig);

    const spriteConfig: SpriteRendererConfig = {
      texture: backgroundTexture,
      x: 0,
      y: 0,
      anchor: { x: 0, y: 0 },
    };

    super(container, spriteConfig);

    this._renderer = renderer;
    this._config = finalConfig;

    this.sprite.width = width;
    this.sprite.height = height;

    logger.debug('🚀 BakedSpaceBackgroundComponent created', { source: 'space-bg' });
  }

  public rebake(renderer: PIXI.Renderer, config: SpaceBackgroundConfig & { mood?: SpaceMood }) {
    logger.info(`Re-baking space background with mood: ${config.mood ?? 'default'}`, { source: 'space-bg' });
    const width = this.sprite.width;
    const height = this.sprite.height;

    const moodConfig = config.mood ? SPACE_PRESETS[config.mood] : {};
    const finalConfig = { ...config, ...moodConfig };
    this._config = finalConfig;

    const newTexture = bakeSpaceBackground(renderer, width, height, finalConfig);

    // Destroy the old texture to free up GPU memory
    this.sprite.texture.destroy();

    this.sprite.texture = newTexture;
  }

  // No update method needed as the texture is static

  resize(width: number, height: number) {
    this.sprite.width = width;
    this.sprite.height = height;

    logger.info(`Re-baking background on resize: ${width}x${height}`, { source: 'space-bg' });

    const newTexture = bakeSpaceBackground(this._renderer, width, height, this._config);

    this.sprite.texture.destroy();
    this.sprite.texture = newTexture;
  }
}
