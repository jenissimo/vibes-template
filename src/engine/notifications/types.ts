export type NotificationCategory = 'reminder' | 'gameplay';

export interface ScheduleOptions {
  key: string;
  title: string;
  body: string;
  fireAt: Date;
  category?: NotificationCategory;
}

export type ScheduleFn = (options: ScheduleOptions) => Promise<void>;

export interface INotificationScheduler {
  readonly id: string;
  onAppPause(schedule: ScheduleFn): void;
  onAppResume?(): void;
}
