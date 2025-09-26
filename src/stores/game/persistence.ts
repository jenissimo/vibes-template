import { logger } from '@/engine/logging';
import { eventBus } from '@/engine/events/EventBus';
import { PlayerProfile, PlayerSettings, profileStore } from './profile';

/**
 * Storage keys for different data types
 */
const STORAGE_KEYS = {
  PROFILE: 'idle-neon-miner-profile',
  SETTINGS: 'idle-neon-miner-settings', // Legacy support
} as const;

/**
 * Current data version for migration
 */
const CURRENT_VERSION = '1.0.0';

/**
 * Persistence service for saving/loading game data
 */
export class PersistenceService {
  private isEnabled = true;
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly SAVE_DELAY = 1000; // Save after 1 second of inactivity
  private disposables: Array<() => void> = [];
  private destroyed = false;

  constructor() {
    this.checkStorageAvailability();
    this.initEventListeners();
  }

  /**
   * Initialize event listeners for auto-save
   */
  private initEventListeners(): void {
    if (!this.isEnabled) {
      logger.warn('⚠️ Persistence disabled: storage unavailable', { source: 'persistence' });
      return;
    }

    const offProfileChanged = eventBus.on('profile-changed', (data) => {
      if (this.destroyed) return;
      this.scheduleSave('profile', data.profile);
    });

    const offProfileReset = eventBus.on('profile-reset', () => {
      if (this.destroyed) return;
      this.clearAllData();
    });

    const onBeforeUnload = () => {
      this.saveImmediately();
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        this.saveImmediately();
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('visibilitychange', onVisibilityChange);

    this.disposables.push(
      offProfileChanged,
      offProfileReset,
      () => window.removeEventListener('beforeunload', onBeforeUnload),
      () => document.removeEventListener('visibilitychange', onVisibilityChange)
    );
  }

  /**
   * Check if localStorage is available
   */
  private checkStorageAvailability(): void {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      this.isEnabled = true;
      logger.info('💾 LocalStorage is available', { source: 'persistence' });
    } catch (error) {
      this.isEnabled = false;
      logger.warn('⚠️ LocalStorage not available, persistence disabled', { 
        error, 
        source: 'persistence' 
      });
    }
  }

  /**
   * Schedule a save operation with debouncing
   */
  private scheduleSave(type: string, data: any): void {
    if (!this.isEnabled || this.destroyed) return;

    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }

    // Schedule new save
    this.saveTimeout = setTimeout(() => {
      this.performSave(type, data);
    }, this.SAVE_DELAY);

    logger.debug('⏰ Scheduled save:', { type, delay: this.SAVE_DELAY });
  }

  /**
   * Perform immediate save
   */
  private saveImmediately(): void {
    if (!this.isEnabled || this.destroyed) return;

    // Clear any pending saves
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }

    // Save current profile state - no need to emit event, just save directly
    const currentProfile = profileStore.get();
    this.performSave('profile', currentProfile);
  }

  /**
   * Perform the actual save operation
   */
  private performSave(type: string, data: any): void {
    if (!this.isEnabled || this.destroyed) return;

    try {
      const saveData = {
        data,
        timestamp: Date.now(),
        version: CURRENT_VERSION,
      };

      const key = type === 'profile' ? STORAGE_KEYS.PROFILE : STORAGE_KEYS.SETTINGS;
      localStorage.setItem(key, JSON.stringify(saveData));

      logger.debug('💾 Data saved:', { 
        type, 
        key, 
        size: JSON.stringify(saveData).length 
      });
    } catch (error) {
      logger.error('❌ Failed to save data:', error as Error, { type, source: 'persistence' });
    }
  }

  /**
   * Load profile data from storage
   */
  public loadProfile(): Partial<PlayerProfile> | null {
    if (!this.isEnabled) return null;

    try {
      // Try to load new profile format first
      let saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      let isLegacy = false;

      // Fallback to legacy settings if profile not found
      if (!saved) {
        saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        isLegacy = true;
      }

      if (!saved) {
        logger.info('📥 No saved profile found', { source: 'persistence' });
        return null;
      }

      const parsed = JSON.parse(saved);
      
      // Check version compatibility
      if (parsed.version !== CURRENT_VERSION) {
        logger.warn('⚠️ Profile version mismatch, using defaults', { 
          saved: parsed.version, 
          current: CURRENT_VERSION,
          source: 'persistence' 
        });
        return null;
      }

      logger.info('📥 Profile loaded:', { 
        version: parsed.version,
        timestamp: new Date(parsed.timestamp).toISOString(),
        isLegacy,
        source: 'persistence' 
      });

      // If legacy settings, wrap in profile structure
      if (isLegacy) {
        return { settings: parsed.data };
      }

      return parsed.data;
    } catch (error) {
      logger.error('❌ Failed to load profile:', error as Error, { source: 'persistence' });
      return null;
    }
  }

  /**
   * Load settings data from storage (legacy support)
   */
  public loadSettings(): Partial<PlayerSettings> | null {
    const profile = this.loadProfile();
    return profile?.settings || null;
  }

  /**
   * Clear all saved data
   */
  public clearAllData(): void {
    if (!this.isEnabled || this.destroyed) return;

    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });

      logger.info('🗑️ All data cleared', { source: 'persistence' });
    } catch (error) {
      logger.error('❌ Failed to clear data:', error as Error, { source: 'persistence' });
    }
  }

  /**
   * Get storage usage info
   */
  public getStorageInfo(): { used: number; available: number; percentage: number } {
    if (!this.isEnabled) {
      return { used: 0, available: 0, percentage: 0 };
    }

    try {
      let used = 0;
      Object.values(STORAGE_KEYS).forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          used += item.length;
        }
      });

      // Estimate available space (5MB is typical limit)
      const available = 5 * 1024 * 1024 - used;
      const percentage = (used / (5 * 1024 * 1024)) * 100;

      return { used, available, percentage };
    } catch (error) {
      logger.error('❌ Failed to get storage info:', error as Error, { source: 'persistence' });
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  /**
   * Check if persistence is enabled
   */
  public isPersistenceEnabled(): boolean {
    return this.isEnabled;
  }

  public destroy(): void {
    if (this.destroyed) return;

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }

    for (const dispose of this.disposables.splice(0)) {
      try {
        dispose();
      } catch (error) {
        logger.warn('⚠️ Persistence dispose failed', { error, source: 'persistence' });
      }
    }

    this.destroyed = true;
    logger.info('🧹 PersistenceService destroyed', { source: 'persistence' });
  }
}

// Singleton instance
export const persistenceService = new PersistenceService();
