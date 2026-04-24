export enum AdResult {
  Completed = 'completed',
  Failed = 'failed',
  NotReady = 'not-ready',
}

export interface AdService {
  initialize(): Promise<void>;

  prepareRewarded(): void;
  prepareInterstitial(): void;

  showRewarded(): Promise<AdResult>;
  showInterstitial(): Promise<void>;

  isRewardedReady(): boolean;
  isInterstitialReady(): boolean;

  showPrivacyOptions(): Promise<void>;
  isPrivacyOptionsRequired(): boolean;

  dispose(): void;
}
