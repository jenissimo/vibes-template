import { logger } from '@/engine/logging';
import { eventBus } from '@/engine/events/EventBus';
import { monetizationActions } from '@/stores/game/monetization';
import { AdResult } from './AdService';
import type { AdService } from './AdService';

const MOCK_REWARDED_DELAY = 500;
const MOCK_INTERSTITIAL_DELAY = 300;

export class MockAdService implements AdService {
  private rewardedReady = false;
  private interstitialReady = false;

  async initialize(): Promise<void> {
    logger.info('MockAdService initialized', { source: 'ads-mock' });
    this.prepareRewarded();
    this.prepareInterstitial();
  }

  prepareRewarded(): void {
    this.rewardedReady = true;
    monetizationActions.setRewardedAdStatus('ready');
    logger.info('Mock rewarded ad ready', { source: 'ads-mock' });
  }

  prepareInterstitial(): void {
    this.interstitialReady = true;
    monetizationActions.setInterstitialStatus('ready');
    logger.info('Mock interstitial ready', { source: 'ads-mock' });
  }

  async showRewarded(): Promise<AdResult> {
    if (!this.rewardedReady) {
      return AdResult.NotReady;
    }

    this.rewardedReady = false;
    monetizationActions.setRewardedAdStatus('loading');
    eventBus.emit('ad-will-show');

    logger.info('Mock rewarded ad showing...', { source: 'ads-mock' });
    await this.delay(MOCK_REWARDED_DELAY);

    eventBus.emit('ad-did-dismiss');
    logger.info('Mock rewarded ad completed', { source: 'ads-mock' });

    this.prepareRewarded();
    return AdResult.Completed;
  }

  async showInterstitial(): Promise<void> {
    if (!this.interstitialReady) return;

    this.interstitialReady = false;
    monetizationActions.setInterstitialStatus('loading');
    eventBus.emit('ad-will-show');

    logger.info('Mock interstitial showing...', { source: 'ads-mock' });
    await this.delay(MOCK_INTERSTITIAL_DELAY);

    eventBus.emit('ad-did-dismiss');
    logger.info('Mock interstitial dismissed', { source: 'ads-mock' });

    this.prepareInterstitial();
  }

  isRewardedReady(): boolean {
    return this.rewardedReady;
  }

  isInterstitialReady(): boolean {
    return this.interstitialReady;
  }

  async showPrivacyOptions(): Promise<void> {
    logger.info('Mock showPrivacyOptions (no-op)', { source: 'ads-mock' });
  }

  isPrivacyOptionsRequired(): boolean {
    return false;
  }

  dispose(): void {
    logger.info('MockAdService disposed', { source: 'ads-mock' });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
