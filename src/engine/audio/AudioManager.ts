import { atom } from 'nanostores';
import { logger } from '@/engine/logging';
import { eventBus } from '@/engine/events/EventBus';
import { Howl, Howler } from 'howler';
import { SfxPlayer } from './sfx/SfxPlayer';
import { profileStore, profileActions } from '@/stores/game/profile';
import type {
  AudioConfig,
  AudioConfigStore,
  SfxId,
  MusicId,
  SfxPlayParams,
} from './AudioTypes';
import { DEFAULT_AUDIO_CONFIG, MUSIC_PATHS } from './AudioConfig';

const INIT_TIMEOUT_MS = 3000;

const withTimeout = <T,>(p: Promise<T>, ms: number, label: string) =>
  Promise.race<T>([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`${label} timeout`)), ms)),
  ]);

const clamp01 = (v: number) => (Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0);

export class AudioManager {
  private static instance: AudioManager;
  static getInstance(): AudioManager {
    return (AudioManager.instance ??= new AudioManager());
  }

  public readonly configStore: AudioConfigStore = atom<AudioConfig>(DEFAULT_AUDIO_CONFIG);

  private sfx: SfxPlayer = new SfxPlayer(this.configStore);

  private music = new Map<MusicId, Howl>();
  private currentMusicId: MusicId | null = null;
  private currentSoundId: number | null = null; // sound instance id for pause/resume
  private pausedMusicId: MusicId | null = null;
  private pausedSoundId: number | null = null;
  private pendingMusicId: MusicId | null = null;

  private isInitialized = false;
  private audioAvailable = true;
  private tracksInitialized = false;
  private isSyncing = false;
  private isInitializing = false;
  private adEventUnsubs: (() => void)[] = [];

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  public async initialize(): Promise<void> {
    if (this.isInitialized || this.isInitializing) {
      logger.info('🎵 AudioManager already initialized, skipping', { source: 'game' });
      return;
    }

    this.isInitializing = true;
    logger.info('🎵 Initializing AudioManager…', { source: 'game' });
    try {
      await withTimeout(this.performInitialization(), INIT_TIMEOUT_MS, 'AudioManager init');
      logger.info('✅ AudioManager initialized', { source: 'game' });
    } catch (err) {
      // Timeout is expected on Android WebView before first user gesture.
      // Howler will auto-unlock AudioContext on tap, so keep audioAvailable = true.
      logger.warn('⚠️ AudioManager init timeout (audio will unlock on first tap)', { err, source: 'game' });
    } finally {
      this.isInitialized = true;
      this.isInitializing = false;
    }

    // Setup unlock listener for Android WebView — retry pending music on first tap
    this.setupUnlockListener();

    if (this.pendingMusicId) {
      logger.info(`🎵 Playing queued music: ${this.pendingMusicId}`, { source: 'game' });
      await this.playMusic(this.pendingMusicId);
      this.pendingMusicId = null;
    }
  }

  private async performInitialization(): Promise<void> {
    this.initHowlerFromConfig(this.configStore.get());
    this.initConfigListener();
    this.initPersistence();
    this.initAdMuteListeners();
    this.ensureTracksInitialized();
    this.applySettingsFromStore();
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  public playSFX(id: SfxId, params?: SfxPlayParams): void {
    if (!this.ready()) {
      if (this.isInitialized && !this.audioAvailable) {
        void this.tryRecoverAudio();
      }
      return;
    }
    const cfg = this.configStore.get();
    if (cfg.muted || cfg.sfxVolume === 0) return;
    this.sfx.play(id, params).catch((err) => {
      logger.warn('⚠️ SFX play failed', { id, err, source: 'game' });
    });
  }

  public async playMusic(id: MusicId): Promise<void> {
    if (!this.isInitialized) {
      logger.info(`🎵 Not initialized, queue music: ${id}`, { source: 'game' });
      this.pendingMusicId = id;
      return;
    }
    if (!this.audioAvailable) {
      logger.info(`🎵 Audio unavailable, skip music: ${id}`, { source: 'game' });
      return;
    }

    const cfg = this.configStore.get();
    if (cfg.muted || cfg.musicVolume === 0) {
      logger.info(`🔇 Music blocked (muted/vol=0), queue: ${id}`, { source: 'game' });
      this.pendingMusicId = id;
      return;
    }

    // Если уже играет тот же трек, не перезапускаем
    if (this.currentMusicId === id && this.currentSoundId !== null) {
      logger.info(`🎵 Music already playing: ${id}`, { source: 'game' });
      return;
    }

    this.ensureTracksInitialized();
    this.stopMusic(); // stop previous if any

    const howl = this.music.get(id);
    if (!howl) {
      logger.warn(`[AudioManager] Music track not found: ${id}`, { source: 'game' });
      return;
    }
    
    // Дожидаемся загрузки трека перед воспроизведением
    if (howl.state() !== 'loaded') {
      await new Promise<void>((resolve, reject) => {
        howl.once('load', () => resolve());
        howl.once('loaderror', (_id, err) => reject(err));
      });
    }

    howl.volume(cfg.musicVolume);
    const soundId = howl.play(); // returns instance id
    this.currentMusicId = id;
    this.currentSoundId = soundId;

    logger.info(`🎵 Playing music: ${id}`, { source: 'game' });
  }

  public stopMusic(): void {
    if (!this.currentMusicId) return;
    const howl = this.music.get(this.currentMusicId);
    if (howl && this.currentSoundId !== null) howl.stop(this.currentSoundId);
    this.currentMusicId = null;
    this.currentSoundId = null;
    this.pausedMusicId = null;
    this.pausedSoundId = null;
  }

  public pauseMusic(): void {
    if (!this.currentMusicId || this.currentSoundId === null) return;
    const howl = this.music.get(this.currentMusicId);
    if (!howl) return;
    howl.pause(this.currentSoundId);
    this.pausedMusicId = this.currentMusicId;
    this.pausedSoundId = this.currentSoundId;
    this.currentMusicId = null;
    this.currentSoundId = null;
    logger.info('⏸️ Music paused', { track: this.pausedMusicId, source: 'game' });
  }

  public stopAll(): void {
    this.stopMusic();
  }

  public setMasterVolume = (v: number) => this.updateConfig({ masterVolume: v });
  public setMusicVolume = (v: number) => this.updateConfig({ musicVolume: v });
  public setSfxVolume = (v: number) => this.updateConfig({ sfxVolume: v });
  public setMuted = (muted: boolean) => this.updateConfig({ muted });
  public toggleMute = () => this.updateConfig({ muted: !this.configStore.get().muted });

  public resetConfig(): void {
    logger.info('🔄 Reset audio config to defaults', { source: 'game' });
    this.configStore.set(DEFAULT_AUDIO_CONFIG);
  }

  public getConfig(): Readonly<AudioConfig> {
    return { ...this.configStore.get() };
  }

  public isAudioAvailable(): boolean {
    return this.audioAvailable && this.isInitialized;
  }


  // ── Init internals ─────────────────────────────────────────────────────────
  private ensureTracksInitialized(): void {
    if (this.tracksInitialized) return;
    Object.keys(MUSIC_PATHS).forEach((k) => {
      const id = k as MusicId;
      const howl = new Howl({
        src: MUSIC_PATHS[id],
        loop: true,
        volume: this.configStore.get().musicVolume,
        onload: () => logger.info(`✅ Music loaded: ${id}`, { source: 'game' }),
        onloaderror: (_sid, err) =>
          logger.error('❌ Music load failed', err as Error, { id, source: 'game' }),
      });
      this.music.set(id, howl);
    });
    this.tracksInitialized = true;
  }

  private initHowlerFromConfig(cfg: AudioConfig) {
    Howler.volume(cfg.masterVolume);
    Howler.mute(cfg.muted);
  }

  private initConfigListener(): void {
    this.configStore.subscribe((cfg) => {
      // master & mute
      this.initHowlerFromConfig(cfg);

      // music volume / resume logic
      if (cfg.muted || cfg.musicVolume === 0) {
        this.pauseMusic();
      } else {
        // update current track volume
        if (this.currentMusicId) {
          this.music.get(this.currentMusicId)?.volume(cfg.musicVolume);
        }

        // resume paused track if any
        if (this.pausedMusicId && this.pausedSoundId !== null) {
          const howl = this.music.get(this.pausedMusicId);
          if (howl) {
            howl.volume(cfg.musicVolume);
            howl.play(this.pausedSoundId); // resumes from paused position
            this.currentMusicId = this.pausedMusicId;
            this.currentSoundId = this.pausedSoundId;
            this.pausedMusicId = null;
            this.pausedSoundId = null;
            logger.info('▶️ Music resumed', { track: this.currentMusicId, source: 'game' });
          }
        } else if (this.pendingMusicId) {
          // or play pending request
          const id = this.pendingMusicId;
          this.pendingMusicId = null;
          void this.playMusic(id);
        }
      }

      // Sync audio config changes back to profile
      this.syncToProfile(cfg);
    });
  }

  private initPersistence(): void {
    // Подписываемся напрямую на изменения Profile store
    profileStore.subscribe((profile) => {
      if (this.isSyncing) return;
      
      const audioSettings = profile.settings.audio;
      this.syncWithSettings(audioSettings);
    });
  }

  // ── Config helpers ─────────────────────────────────────────────────────────
  private updateConfig(upd: Partial<AudioConfig>): void {
    const cur = this.configStore.get();
    const next: AudioConfig = {
      ...cur,
      ...(upd.masterVolume !== undefined ? { masterVolume: clamp01(upd.masterVolume) } : null),
      ...(upd.musicVolume !== undefined ? { musicVolume: clamp01(upd.musicVolume) } : null),
      ...(upd.sfxVolume !== undefined ? { sfxVolume: clamp01(upd.sfxVolume) } : null),
      ...(upd.muted !== undefined ? { muted: !!upd.muted } : null),
    };

    // лог только по реальным изменениям
    const changed: string[] = [];
    (Object.keys(next) as (keyof AudioConfig)[]).forEach((k) => {
      if (cur[k] !== next[k]) changed.push(`${String(k)}: ${cur[k]} → ${next[k]}`);
    });
    if (changed.length) logger.info('⚙️ Audio config changed', { changed, source: 'game' });

    this.configStore.set(next);
  }

  private syncWithSettings(settings: { 
    musicEnabled: boolean; 
    sfxEnabled: boolean;
  }): void {
    if (this.isSyncing) return;
    
    const cur = this.configStore.get();
    
    // Проверяем, нужно ли вообще что-то менять
    const currentMusicEnabled = cur.musicVolume > 0 && !cur.muted;
    const currentSfxEnabled = cur.sfxVolume > 0 && !cur.muted;
    
    if (currentMusicEnabled === settings.musicEnabled && 
        currentSfxEnabled === settings.sfxEnabled) {
      return; // Ничего не изменилось, выходим
    }
    
    this.isSyncing = true;
    try {
      const next: AudioConfig = {
        ...cur,
        musicVolume: settings.musicEnabled ? (cur.musicVolume || 0.7) : 0,
        sfxVolume: settings.sfxEnabled ? (cur.sfxVolume || 0.8) : 0,
        muted: !settings.musicEnabled && !settings.sfxEnabled,
      };
      this.configStore.set(next);
    } finally {
      this.isSyncing = false;
    }
  }

  private syncToProfile(cfg: AudioConfig): void {
    if (this.isSyncing || this.isInitializing) return;
    
    this.isSyncing = true;
    try {
      const audioSettings = {
        musicEnabled: cfg.musicVolume > 0 && !cfg.muted,
        sfxEnabled: cfg.sfxVolume > 0 && !cfg.muted,
      };
      
      profileActions.updateAudioSettings(audioSettings);
    } finally {
      this.isSyncing = false;
    }
  }

  private applySettingsFromStore(): void {
    const { settings } = profileStore.get();
    if (!settings.audio) return;
    this.syncWithSettings(settings.audio);
  }

  // ── Utils ──────────────────────────────────────────────────────────────────
  private ready() {
    return this.isInitialized && this.audioAvailable;
  }

  private setupUnlockListener(): void {
    const unlock = () => {
      // Howler auto-resumes AudioContext on user gesture.
      // If we have pending music, try to play it now.
      if (this.pendingMusicId) {
        const id = this.pendingMusicId;
        this.pendingMusicId = null;
        logger.info(`🔓 Audio unlocked by user gesture, playing: ${id}`, { source: 'game' });
        void this.playMusic(id);
      }
      document.removeEventListener('touchstart', unlock, true);
      document.removeEventListener('click', unlock, true);
    };
    document.addEventListener('touchstart', unlock, { capture: true, once: true });
    document.addEventListener('click', unlock, { capture: true, once: true });
  }

  private initAdMuteListeners(): void {
    this.adEventUnsubs.push(
      eventBus.on('ad-will-show', () => {
        Howler.mute(true);
        logger.info('Audio muted for ad', { source: 'game' });
      }),
      eventBus.on('ad-did-dismiss', () => {
        const cfg = this.configStore.get();
        Howler.mute(cfg.muted);
        logger.info('Audio restored after ad', { source: 'game' });
      }),
    );
  }

  private async tryRecoverAudio(): Promise<boolean> {
    if (this.audioAvailable || this.isInitializing) return this.audioAvailable;

    logger.info('🔄 Attempting audio recovery…', { source: 'game' });
    this.isInitializing = true;
    try {
      await withTimeout(this.performInitialization(), INIT_TIMEOUT_MS, 'AudioManager recovery');
      this.audioAvailable = true;
      logger.info('✅ Audio recovered', { source: 'game' });
      return true;
    } catch (err) {
      logger.warn('⚠️ Audio recovery failed', { err, source: 'game' });
      return false;
    } finally {
      this.isInitializing = false;
    }
  }

  public cleanup(): void {
    logger.info('🧹 AudioManager cleanup…', { source: 'game' });
    for (const unsub of this.adEventUnsubs) unsub();
    this.adEventUnsubs.length = 0;
    this.stopAll();
    for (const [, howl] of this.music) howl.unload();
    this.music.clear();
    this.pausedMusicId = null;
    this.pendingMusicId = null;
    this.currentMusicId = null;
    this.currentSoundId = null;
    this.pausedSoundId = null;
    this.tracksInitialized = false;
    this.isInitialized = false;
    this.audioAvailable = true;
    logger.info('✅ AudioManager cleaned', { source: 'game' });
  }
}

// Singleton
export const audioManager = AudioManager.getInstance();
