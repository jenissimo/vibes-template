import { AudioManager } from './AudioManager';

/**
 * Singleton instance of AudioManager.
 * Import it anywhere in your application for audio management.
 */
export const audioManager = new AudioManager();

// Export types for convenience
export type { AudioConfig, SfxId, MusicId, SfxPlayParams } from './AudioTypes';
