import { AudioConfig } from './AudioTypes';
import mainThemeUrl from '@/assets/audio/music/main_theme.mp3?url';

// Default configuration
export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  masterVolume: 0.7,
  musicVolume: 0.6,
  sfxVolume: 0.8,
  muted: false,
};

// --- FILE PATHS ---
// Set paths here so they're easy to find and change
export const MUSIC_PATHS: Record<string, string[]> = {
  main_theme: [mainThemeUrl],
};

