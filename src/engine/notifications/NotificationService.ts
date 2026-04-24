import { Capacitor } from '@capacitor/core';
import { LocalNotifications, type Importance } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';
import { logger } from '@/engine/logging';
import type { INotificationScheduler, ScheduleOptions, NotificationCategory } from './types';

// ─── Internal Types ─────────────────────────────────────────

interface ChannelConfig {
  id: string;
  name: string;
  description: string;
  importance: Importance;
}

interface CategoryMapping {
  channelId: string;
  allowWhileIdle: boolean;
}

// ─── Hash Function ──────────────────────────────────────────

function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// ─── Category → Platform Mapping ────────────────────────────

const CATEGORY_MAP: Record<NotificationCategory, CategoryMapping> = {
  reminder: { channelId: 'game-reminders', allowWhileIdle: true },
  gameplay: { channelId: 'game-events', allowWhileIdle: false },
};

const DEFAULT_CATEGORY: NotificationCategory = 'gameplay';

const CHANNELS: ChannelConfig[] = [
  { id: 'game-reminders', name: 'Game Reminders', description: 'Return reminders', importance: 3 },
  { id: 'game-events', name: 'Game Events', description: 'Gameplay notifications', importance: 3 },
];

// ─── NotificationService ────────────────────────────────────

export class NotificationService {
  private _schedulers: INotificationScheduler[] = [];
  private _isInBackground = false;
  private _permissionGranted = false;
  private _exactAlarmsAllowed = true;
  private _isNative = false;

  private _visibilityHandler: (() => void) | null = null;
  private _listenerHandles: { remove: () => Promise<void> }[] = [];

  async initialize(): Promise<void> {
    this._isNative = Capacitor.isNativePlatform();

    if (!this._isNative) {
      logger.debug('[NotificationService] Web platform — skipping init');
      return;
    }

    try {
      // Create Android channels
      for (const ch of CHANNELS) {
        await LocalNotifications.createChannel({
          id: ch.id,
          name: ch.name,
          description: ch.description,
          importance: ch.importance,
        });
      }
      logger.debug('[NotificationService] Channels created');
    } catch (e) {
      logger.warn('[NotificationService] Channel creation failed', { error: e });
    }

    // Request permissions
    try {
      const perms = await LocalNotifications.checkPermissions();
      if (perms.display !== 'granted') {
        const result = await LocalNotifications.requestPermissions();
        this._permissionGranted = result.display === 'granted';
      } else {
        this._permissionGranted = true;
      }
      logger.info('[NotificationService] Permission: ' + (this._permissionGranted ? 'granted' : 'denied'));
    } catch (e) {
      logger.warn('[NotificationService] Permission check failed', { error: e });
      this._permissionGranted = false;
    }

    // Check exact alarm setting (Android 12+)
    await this.checkExactAlarms();

    // Lifecycle listeners
    this._visibilityHandler = () => {
      if (document.hidden) {
        this.onAppPause();
      } else {
        this.onAppResume();
      }
    };
    document.addEventListener('visibilitychange', this._visibilityHandler);

    this.addCapacitorListener(App.addListener('pause', () => this.onAppPause()));
    this.addCapacitorListener(App.addListener('resume', () => this.onAppResume()));

    // Clear stale notifications from previous session
    await this.clearAll();

    logger.info('[NotificationService] Initialized', {
      permission: this._permissionGranted,
      exactAlarms: this._exactAlarmsAllowed,
    });
  }

  // ─── Public API ─────────────────────────────────────────

  registerScheduler(scheduler: INotificationScheduler): void {
    this._schedulers.push(scheduler);
  }

  removeScheduler(id: string): void {
    this._schedulers = this._schedulers.filter(s => s.id !== id);
  }

  async schedule(options: ScheduleOptions): Promise<void> {
    if (!this._isNative) {
      logger.debug('[NotificationService] Web — skip schedule', { key: options.key });
      return;
    }

    const id = djb2Hash(options.key);
    const category = options.category ?? DEFAULT_CATEGORY;
    const mapping = CATEGORY_MAP[category];

    try {
      await LocalNotifications.schedule({
        notifications: [{
          id,
          title: options.title,
          body: options.body,
          schedule: {
            at: options.fireAt,
            allowWhileIdle: mapping.allowWhileIdle,
          },
          channelId: mapping.channelId,
        }],
      });

      logger.info(`[NotificationService] Scheduled "${options.key}": "${options.title}" at ${options.fireAt.toISOString()}`);

      if (!this._exactAlarmsAllowed) {
        logger.warn('[NotificationService] Exact alarms disabled — notification may fire with delay');
      }
    } catch (e) {
      logger.warn('[NotificationService] Schedule failed', { key: options.key, error: e });
    }
  }

  destroy(): void {
    if (this._visibilityHandler) {
      document.removeEventListener('visibilitychange', this._visibilityHandler);
      this._visibilityHandler = null;
    }

    for (const handle of this._listenerHandles) {
      handle.remove().catch(() => {});
    }
    this._listenerHandles.length = 0;

    this.clearAll().catch(() => {});

    this._schedulers.length = 0;

    logger.info('[NotificationService] Destroyed');
  }

  // ─── Lifecycle ──────────────────────────────────────────

  private async onAppPause(): Promise<void> {
    if (this._isInBackground) return;
    this._isInBackground = true;

    if (!this._isNative) return;

    await this.refreshPermissionState();

    if (!this._permissionGranted) {
      logger.debug('[NotificationService] Permission denied — skipping schedulers');
      return;
    }

    await this.clearAll();

    const scheduleFn = this.schedule.bind(this);
    for (const scheduler of this._schedulers) {
      try {
        scheduler.onAppPause(scheduleFn);
      } catch (e) {
        logger.warn(`[NotificationService] Scheduler "${scheduler.id}" onAppPause failed`, { error: e });
      }
    }
  }

  private async onAppResume(): Promise<void> {
    if (!this._isInBackground) return;
    this._isInBackground = false;

    if (!this._isNative) return;

    await this.clearAll();
    await this.refreshPermissionState();

    for (const scheduler of this._schedulers) {
      try {
        scheduler.onAppResume?.();
      } catch (e) {
        logger.warn(`[NotificationService] Scheduler "${scheduler.id}" onAppResume failed`, { error: e });
      }
    }
  }

  // ─── Private Helpers ────────────────────────────────────

  private async refreshPermissionState(): Promise<void> {
    try {
      const perms = await LocalNotifications.checkPermissions();
      this._permissionGranted = perms.display === 'granted';
    } catch (e) {
      logger.warn('[NotificationService] Permission refresh failed', { error: e });
    }

    await this.checkExactAlarms();

    logger.debug('[NotificationService] State refreshed', {
      permission: this._permissionGranted ? 'granted' : 'denied',
      exactAlarms: this._exactAlarmsAllowed ? 'allowed' : 'disabled',
    });
  }

  private async checkExactAlarms(): Promise<void> {
    try {
      const setting = await LocalNotifications.checkExactNotificationSetting();
      this._exactAlarmsAllowed = setting.exact_alarm === 'granted';
    } catch {
      // Method may not exist on older Capacitor versions or iOS
      this._exactAlarmsAllowed = true;
    }
  }

  private async clearAll(): Promise<void> {
    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
        logger.debug(`[NotificationService] Cancelled ${pending.notifications.length} pending`);
      }
    } catch (e) {
      logger.warn('[NotificationService] Cancel pending failed', { error: e });
    }

    try {
      await LocalNotifications.removeAllDeliveredNotifications();
    } catch (e) {
      logger.warn('[NotificationService] Remove delivered failed', { error: e });
    }
  }

  private addCapacitorListener(handle: Promise<{ remove: () => Promise<void> }>): void {
    handle.then(h => this._listenerHandles.push(h));
  }
}
