import * as PIXI from 'pixi.js';
import { SpaceBackgroundFilter } from '@/game/graphics/filters/SpaceBackgroundFilter';
import type { SpaceBackgroundConfig } from '@/game/components/SpaceBackgroundComponent';
import { logger } from '@/engine/logging';

/**
 * Generates a static RenderTexture of the space background.
 * @param renderer - The Pixi renderer.
 * @param width - The width of the texture.
 * @param height - The height of the texture.
 * @param config - Configuration for the space background.
 * @returns A RenderTexture with the baked background.
 */
export function bakeSpaceBackground(
  renderer: PIXI.Renderer,
  width: number,
  height: number,
  config?: SpaceBackgroundConfig,
): PIXI.RenderTexture {
  logger.info(`Baking space background texture (${width}x${height})...`, { source: 'graphics' });

  // 1. Create the filter and configure it
  const filter = new SpaceBackgroundFilter();
  filter.setResolution(width, height);
  if (config) {
    if (config.starCount !== undefined) filter.setStarCount(config.starCount);
    if (config.starBrightness !== undefined) filter.setStarBrightness(config.starBrightness);
    if (config.nebulaIntensity !== undefined) filter.setNebulaIntensity(config.nebulaIntensity);
    if (config.nebulaColor1 || config.nebulaColor2 || config.nebulaColor3 || config.nebulaColor4) {
      filter.setNebulaColors(
        config.nebulaColor1 ?? '#0d0d2e',
        config.nebulaColor2 ?? '#1a1a5e',
        config.nebulaColor3 ?? '#4a4a9e',
        config.nebulaColor4 ?? '#8b5cf6',
      );
    }
  }

  // The animation-related uniforms will be at their initial (time=0) state.
  // This is what we want for a static texture.

  // 2. Create a temporary object to apply the filter to
  const tempSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
  tempSprite.width = width;
  tempSprite.height = height;
  tempSprite.filters = [filter];

  // 3. Create the RenderTexture
  const renderTexture = PIXI.RenderTexture.create({
    width,
    height,
    resolution: renderer.resolution,
  });

  // 4. Render the object with the filter to the texture
  renderer.render({ container: tempSprite, target: renderTexture });

  // 5. Clean up
  tempSprite.destroy();
  filter.destroy();

  logger.info('✅ Space background texture baked successfully.', { source: 'graphics' });

  return renderTexture;
}
