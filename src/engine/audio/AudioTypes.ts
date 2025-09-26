import { WritableAtom } from 'nanostores';

// Global audio configuration
export interface AudioConfig {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
}

// Sound IDs - defined here to avoid circular dependencies
export type SfxId = 
  | 'mining_light' | 'mining_medium' | 'mining_medium_loop' | 'mining_heavy'
  | 'explosion_small' | 'explosion_medium' | 'explosion_large'
  | 'collect_coin' | 'collect_ore' | 'collect_energy' | 'collect_rare'
  | 'ui_click' | 'ui_hover' | 'ui_purchase' | 'ui_error' | 'ui_notification'
  | 'drill_spin';

export type MusicId = 'main_theme';


// Parameters for SFX generation
export interface SfxPlayParams {
  volume?: number;
  intensity?: number; // for mining sounds
  size?: number; // for explosion sounds
}

// Definition of function that generates AudioBuffer
export type SfxGeneratorFn = (
  context: AudioContext,
  params: SfxPlayParams
) => AudioBuffer | null;

// Type for state store
export type AudioConfigStore = WritableAtom<AudioConfig>;
