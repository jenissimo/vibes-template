import { logger } from '@/engine/logging';
let audioContext: AudioContext | null = null;
let isInitialized = false;

/**
 * Safely gets or initializes global AudioContext.
 * Automatically resumes it on user interaction.
 */
export async function getAudioContext(): Promise<AudioContext | null> {
  if (!isInitialized) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      isInitialized = true;
      logger.info('✅ [AudioContext] Initialized', { source: 'game' });
    } catch (error) {
      logger.error('❌ [AudioContext] Failed to initialize:', error as Error, { source: 'game' });
      isInitialized = true; // Mark as initialized to avoid retrying
      return null;
    }
  }

  if (!audioContext) {
    return null;
  }

  // Browsers may suspend AudioContext until first user gesture
  if (audioContext.state === 'suspended') {
    try {
      await audioContext.resume();
      //logger.info('✅ [AudioContext] Resumed', { source: 'game' });
    } catch (error) {
      logger.error('❌ [AudioContext] Failed to resume:', error as Error, { source: 'game' });
      return null;
    }
  }

  return audioContext.state === 'running' ? audioContext : null;
}

/**
 * Reinitializes AudioContext (for recovery after errors)
 */
export async function reinitializeAudioContext(): Promise<boolean> {
  logger.info('🔄 [AudioContext] Reinitializing...', { source: 'game' });
  
  // Close old context if exists
  if (audioContext && audioContext.state !== 'closed') {
    await audioContext.close().catch((error) => { logger.error('Promise rejected', error as Error, { source: 'game'  }); });
  }
  
  // Reset state
  audioContext = null;
  isInitialized = false;
  
  // Try to get new context
  const newContext = await getAudioContext();
  if (newContext) {
    logger.info('✅ [AudioContext] Reinitialized successfully', { source: 'game' });
    return true;
  } else {
    logger.warn('❌ [AudioContext] Failed to reinitialize', { source: 'game' });
    return false;
  }
}
