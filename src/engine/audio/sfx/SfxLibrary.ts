import { SfxId, SfxGeneratorFn } from '../AudioTypes';
import { generateMiningSound, generateDrillSound } from './generators/generate-mining';
import { generateExplosionSound } from './generators/generate-explosions';
import { generateCoinSound, generateOreSound, generateEnergySound, generateRareSound } from './generators/generate-collection';
import { generateClickSound, generateHoverSound, generatePurchaseSound, generateErrorSound, generateNotificationSound } from './generators/generate-ui';

/**
 * Registry (map) of SFX generation functions.
 * Factory pattern - to add a new sound, just add an entry here.
 */
export const sfxLibrary = new Map<SfxId, SfxGeneratorFn>([
  // Mining sounds
  ['mining_light', (ctx, params) => generateMiningSound(ctx, params.intensity ?? 0.3)],
  ['mining_medium', (ctx, params) => generateMiningSound(ctx, params.intensity ?? 0.6)],
  ['mining_medium_loop', (ctx, params) => generateMiningSound(ctx, params.intensity ?? 0.6)],
  ['mining_heavy', (ctx, params) => generateMiningSound(ctx, params.intensity ?? 1.0)],
  ['drill_spin', (ctx, params) => generateDrillSound(ctx, params.intensity ?? 1.0)],
  
  // Explosion sounds
  ['explosion_small', (ctx, params) => generateExplosionSound(ctx, params.size ?? 0.5)],
  ['explosion_medium', (ctx, params) => generateExplosionSound(ctx, params.size ?? 1.0)],
  ['explosion_large', (ctx, params) => generateExplosionSound(ctx, params.size ?? 1.5)],
  
  // Collection sounds
  ['collect_coin', (ctx, params) => generateCoinSound(ctx, params.intensity ?? 1.0)],
  ['collect_ore', (ctx, params) => generateOreSound(ctx, params.intensity ?? 1.0)],
  ['collect_energy', (ctx, params) => generateEnergySound(ctx, params.intensity ?? 1.0)],
  ['collect_rare', (ctx, params) => generateRareSound(ctx, params.intensity ?? 1.0)],
  
  // UI sounds
  ['ui_click', (ctx, params) => generateClickSound(ctx, params.intensity ?? 1.0)],
  ['ui_hover', (ctx, params) => generateHoverSound(ctx, params.intensity ?? 1.0)],
  ['ui_purchase', (ctx, params) => generatePurchaseSound(ctx, params.intensity ?? 1.0)],
  ['ui_error', (ctx, params) => generateErrorSound(ctx, params.intensity ?? 1.0)],
  ['ui_notification', (ctx, params) => generateNotificationSound(ctx, params.intensity ?? 1.0)],
]);
