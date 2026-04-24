import { logger } from '@/engine/logging';
import { monetizationActions } from '@/stores/game/monetization';
import { AdResult } from './AdService';
import type { AdService } from './AdService';

export class DisabledAdService implements AdService {
  async initialize(): Promise<void> {
    monetizationActions.setRewardedAdStatus('unavailable');
    monetizationActions.setInterstitialStatus('unavailable');
    logger.warn('AdService disabled — no ads will be shown', { source: 'ads' });
  }

  prepareRewarded(): void {
    // no-op
  }

  prepareInterstitial(): void {
    // no-op
  }

  async showRewarded(): Promise<AdResult> {
    logger.warn('showRewarded called on DisabledAdService', { source: 'ads' });
    return AdResult.NotReady;
  }

  async showInterstitial(): Promise<void> {
    // no-op
  }

  isRewardedReady(): boolean {
    return false;
  }

  isInterstitialReady(): boolean {
    return false;
  }

  async showPrivacyOptions(): Promise<void> {
    // no-op
  }

  isPrivacyOptionsRequired(): boolean {
    return false;
  }

  dispose(): void {
    // nothing to clean up
  }
}
