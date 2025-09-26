import { getAudioContext } from '../utils/audio-context';
import { logger } from '@/engine/logging';
import { sfxLibrary } from './SfxLibrary';
import { AudioConfigStore, SfxId, SfxPlayParams } from '../AudioTypes';

/**
 * Responsible for generating and playing short sound effects (SFX).
 */
export class SfxPlayer {
  private audioConfigStore: AudioConfigStore;

  constructor(audioConfigStore: AudioConfigStore) {
    this.audioConfigStore = audioConfigStore;
  }

  /**
   * Generates and plays SFX by its ID.
   * @param sfxId Unique sound identifier
   * @param params Additional parameters (volume, intensity)
   */
  public async play(sfxId: SfxId, params: SfxPlayParams = {}): Promise<void> {
    // Note: AudioManager already checks config, but we keep this as a safety net
    const config = this.audioConfigStore.get();
    if (config.muted || config.sfxVolume === 0) return;

    const context = await getAudioContext();
    if (!context) return;
    
    const generator = sfxLibrary.get(sfxId);
    if (!generator) {
      logger.warn(`[SfxPlayer] SFX generator for "${sfxId}" not found.`, { source: 'game' });
      return;
    }

    const buffer = generator(context, params);
    if (!buffer) return;

    this.playBuffer(context, buffer, params.volume ?? 1.0);
  }

  private playBuffer(
    context: AudioContext,
    buffer: AudioBuffer,
    localVolume: number
  ): void {
    try {
      const source = context.createBufferSource();
      source.buffer = buffer;

      const gainNode = context.createGain();
      const { masterVolume, sfxVolume } = this.audioConfigStore.get();
      gainNode.gain.value = localVolume * sfxVolume * masterVolume;

      source.connect(gainNode);
      gainNode.connect(context.destination);

      // Handle playback errors
      source.onended = () => {
        // Clean up resources after playback
        source.disconnect();
        gainNode.disconnect();
      };

      source.start();
    } catch (error) {
      logger.error('❌ [SfxPlayer] Failed to play audio buffer:', error as Error, { source: 'game' });
    }
  }
}
