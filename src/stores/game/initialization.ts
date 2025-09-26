import { logger } from '@/engine/logging';
import { profileActions } from './profile';
import { persistenceService } from './persistence';
import { audioManager } from '@/engine/audio/AudioManager';

/**
 * Service for initializing game profile and settings
 */
export class ProfileInitializationService {
  private isInitialized = false;

  /**
   * Initialize profile and load saved data
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('⚠️ Profile already initialized', { source: 'init' });
      return;
    }

    logger.info('🚀 Initializing profile system...', { source: 'init' });

    try {
      // Load saved profile
      const savedProfile = persistenceService.loadProfile();
      
      if (savedProfile) {
        // Load profile data
        profileActions.loadProfile(savedProfile);
        logger.info('✅ Profile loaded from storage', { 
          settings: savedProfile.settings,
          source: 'init' 
        });
      } else {
        logger.info('📝 Using default profile', { source: 'init' });
      }

      // Initialize audio manager with settings
      await audioManager.initialize();
      // AudioManager теперь автоматически синхронизируется через подписку на settingsStore

      this.isInitialized = true;
      logger.info('✅ Profile system initialized', { source: 'init' });
    } catch (error) {
      logger.error('❌ Failed to initialize profile:', error as Error, { source: 'init' });
      throw error;
    }
  }


  /**
   * Check if profile is initialized
   */
  public isProfileInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Reset profile and reinitialize
   */
  public async resetAndReinitialize(): Promise<void> {
    logger.info('🔄 Resetting and reinitializing profile...', { source: 'init' });
    
    this.isInitialized = false;
    profileActions.resetProfile();
    persistenceService.clearAllData();
    
    await this.initialize();
  }
}

// Singleton instance
export const profileInitService = new ProfileInitializationService();

// Legacy export for backward compatibility
export const settingsInitService = profileInitService;
