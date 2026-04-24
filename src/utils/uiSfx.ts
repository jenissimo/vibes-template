import { audioManager } from '@/engine/audio/AudioManager';

/** Play UI click sound — call from Svelte onclick handlers */
export function playClick(): void {
  audioManager.playSFX('ui_click');
}
