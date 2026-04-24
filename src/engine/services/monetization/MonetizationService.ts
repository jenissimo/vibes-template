import { logger } from '@/engine/logging';
import { eventBus } from '@/engine/events/EventBus';
import { monetizationStore } from '@/stores/game/monetization';
import type { AdService } from '@/engine/services/ads/AdService';
import { AdResult } from '@/engine/services/ads/AdService';
import type { AdPlacement } from '@/engine/services/ads/AdPlacements';
import type { RewardType, RewardResult } from '@/stores/game/monetization';

export class MonetizationService {
  private adService: AdService;
  private inFlight = false;
  private lastInterstitialTime = 0;
  private readonly minInterstitialIntervalMs = 60_000;
  private unsubscribers: (() => void)[] = [];

  constructor(adService: AdService) {
    this.adService = adService;

    this.unsubscribers.push(
      eventBus.on('open-privacy-options', () => {
        this.adService.showPrivacyOptions().catch((e) => {
          logger.warn('showPrivacyOptions failed', { source: 'monetization', error: e });
        });
      }),
    );
  }

  async offerReward(_type: RewardType, placement: AdPlacement): Promise<RewardResult> {
    if (this.inFlight) {
      return { granted: false, reason: 'in-flight' };
    }

    const state = monetizationStore.get();

    if (state.noAdsActive) {
      return { granted: true, reason: 'no-ads-free' };
    }

    if (state.rewardedAdStatus !== 'ready') {
      return { granted: false, reason: 'not-ready' };
    }

    this.inFlight = true;
    try {
      eventBus.emit('ad-started', { adType: 'rewarded', placement });

      const result = await this.adService.showRewarded();

      if (result === AdResult.Completed) {
        eventBus.emit('ad-completed', { adType: 'rewarded', placement });
        logger.info(`Rewarded ad completed [${placement}]`, { source: 'monetization' });
        return { granted: true };
      }

      logger.info(`Rewarded ad not completed: ${result} [${placement}]`, { source: 'monetization' });
      return { granted: false, reason: 'failed' };
    } catch (e) {
      logger.error('offerReward error', e as Error, { source: 'monetization' });
      return { granted: false, reason: 'failed' };
    } finally {
      this.inFlight = false;
    }
  }

  async tryShowInterstitial(placement: AdPlacement): Promise<void> {
    const state = monetizationStore.get();

    if (state.noAdsActive) return;
    if (this.inFlight) return;
    if (Date.now() - this.lastInterstitialTime < this.minInterstitialIntervalMs) return;
    if (state.interstitialStatus !== 'ready') return;

    this.inFlight = true;
    try {
      eventBus.emit('ad-started', { adType: 'interstitial', placement });

      await this.adService.showInterstitial();
      this.lastInterstitialTime = Date.now();

      eventBus.emit('ad-completed', { adType: 'interstitial', placement });
      logger.info(`Interstitial shown [${placement}]`, { source: 'monetization' });
    } catch (e) {
      logger.warn('tryShowInterstitial error', { source: 'monetization', error: e });
    } finally {
      this.inFlight = false;
    }
  }

  preloadAll(): void {
    const { noAdsActive } = monetizationStore.get();
    if (noAdsActive) return;
    this.adService.prepareRewarded();
    this.adService.prepareInterstitial();
  }

  isNoAdsActive(): boolean {
    return monetizationStore.get().noAdsActive;
  }

  shouldShowAds(): boolean {
    return !this.isNoAdsActive();
  }

  isRewardedAdReady(): boolean {
    return monetizationStore.get().rewardedAdStatus === 'ready';
  }

  dispose(): void {
    for (const unsub of this.unsubscribers) unsub();
    this.unsubscribers.length = 0;
    logger.info('MonetizationService disposed', { source: 'monetization' });
  }
}
