// engine/types.ts — Shared type definitions for the engine

import type * as PIXI from 'pixi.js';
import type { PixiRenderer } from './render/PixiRenderer';
import type { AssetManager } from './assets/AssetManager';
import type { InputManager } from './input/InputManager';
import type { EffectSystem } from './effects/EffectSystem';
import type { AudioManager } from './audio/AudioManager';
import type { CoordinateService } from './coordinates/CoordinateService';
import type { Game } from './Game';

/**
 * Managers passed to scenes via Scene.initialize().
 * Scenes use this to access engine subsystems without global dependencies.
 */
export interface GameManagers {
  renderer: PixiRenderer;
  assets: AssetManager;
  input: InstanceType<typeof InputManager>;
  effects: EffectSystem;
  audio: AudioManager;
  coordinates: CoordinateService;
  stage: PIXI.Container;
  game: Game;
}
