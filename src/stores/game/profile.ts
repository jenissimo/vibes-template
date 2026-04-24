import { eventBus } from '@/engine/events';
import { logger } from '@/engine/logging';
import { map } from 'nanostores';

/** Storage key for the persisted profile. Kept in sync with PersistenceService. */
const PROFILE_STORAGE_KEY = 'idle-neon-miner-profile';

/**
 * Player settings interface - только вкл/выкл
 */
export interface PlayerSettings {
  audio: {
    musicEnabled: boolean;
    sfxEnabled: boolean;
  };
  /** 'system' or a SupportedLocale code. Optional; absent = use system. */
  languagePreference?: string;
  version: string;
}

/**
 * Player profile interface - полный профиль игрока
 */
export interface PlayerProfile {
  settings: PlayerSettings;
  version: string;
}

/**
 * Default settings values
 */
const DEFAULT_SETTINGS: PlayerSettings = {
  audio: {
    musicEnabled: true,
    sfxEnabled: true,
  },
  version: '1.0.0',
};

/**
 * Default profile values
 */
const DEFAULT_PROFILE: PlayerProfile = {
  settings: DEFAULT_SETTINGS,
  version: '1.0.0',
};

/**
 * Profile store using Nanostores map
 */
export const profileStore = map<PlayerProfile>(DEFAULT_PROFILE);

/**
 * Profile actions
 */
export const profileActions = {
  /**
   * Update audio settings
   */
  updateAudioSettings(audioConfig: Partial<PlayerSettings['audio']>): void {
    const current = profileStore.get();
    const newAudio = { ...current.settings.audio, ...audioConfig };
    
    logger.debug('🎵 Updating audio settings:', { 
      old: current.settings.audio, 
      new: newAudio 
    });
    
    profileStore.setKey('settings', { ...current.settings, audio: newAudio });
  },
  
  /**
   * Reset profile to defaults
   */
  resetProfile(): void {
    logger.info('🔄 Resetting profile to defaults');
    
    profileStore.set(DEFAULT_PROFILE);
    
    // Emit reset event
    eventBus.emit('profile-reset');
  },
  
  /**
   * Get current profile (read-only)
   */
  getProfile(): Readonly<PlayerProfile> {
    return { ...profileStore.get() };
  },
  
  /**
   * Load profile from storage
   */
  loadProfile(profile: Partial<PlayerProfile>): void {
    const current = profileStore.get();
    const mergedProfile = { ...DEFAULT_PROFILE, ...current, ...profile };
    
    profileStore.set(mergedProfile);
  },
};

/**
 * Subscribe to profile changes for persistence
 * Используем setTimeout чтобы убедиться, что persistenceService уже инициализирован
 */
setTimeout(() => {
  profileStore.subscribe((profile) => {
    // Emit event for persistence service
    eventBus.emit('profile-changed', { profile });
  });
}, 0);

/**
 * Export commonly used selectors
 */
export const profileSelectors = {
  settings: () => profileStore.get().settings,
  audio: () => profileStore.get().settings.audio,
};

/**
 * Read the persisted language preference directly from localStorage,
 * without initializing the full PersistenceService.
 *
 * Used by main.ts to seed i18n before Svelte mounts.
 * Returns undefined when no value is persisted or storage is unavailable.
 */
export function getPersistedLanguagePreference(): string | undefined {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { data?: PlayerProfile };
    return parsed?.data?.settings?.languagePreference;
  } catch {
    return undefined;
  }
}
