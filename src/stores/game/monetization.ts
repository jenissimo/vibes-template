import { map } from 'nanostores';

// ─── Types ──────────────────────────────────────────────────

/** Game-defined reward type string (e.g. 'extra-life', 'double-coins'). */
export type RewardType = string;

export type AdStatus = 'loading' | 'ready' | 'unavailable';

export interface RewardResult {
  granted: boolean;
  reason?: 'failed' | 'not-ready' | 'no-ads-free' | 'in-flight';
}

// ─── State ──────────────────────────────────────────────────

export interface MonetizationState {
  // === Persistent (managed via setNoAds / loadPersistedNoAds) ===
  noAdsActive: boolean;
  noAdsExpiresAt: number | null;
  privacyOptionsRequired: boolean;

  // === Ad status (managed by AdService) ===
  rewardedAdStatus: AdStatus;
  interstitialStatus: AdStatus;

  // === IAP status ===
  iapStatus: 'loading' | 'ready' | 'unavailable';
  noAdsProductPrice: string | null;
  purchaseInProgress: boolean;

  // === Session/offer (cleared by resetOffer) ===
  activeOffer: RewardType | null;
  offerAvailable: boolean;
  offerGranted: boolean;
}

const DEFAULT_STATE: MonetizationState = {
  noAdsActive: false,
  noAdsExpiresAt: null,
  privacyOptionsRequired: false,
  rewardedAdStatus: 'loading',
  interstitialStatus: 'loading',
  iapStatus: 'loading',
  noAdsProductPrice: null,
  purchaseInProgress: false,
  activeOffer: null,
  offerAvailable: false,
  offerGranted: false,
};

// ─── Store ──────────────────────────────────────────────────

export const monetizationStore = map<MonetizationState>({ ...DEFAULT_STATE });

// ─── Storage keys ───────────────────────────────────────────

const LS_NO_ADS_ACTIVE = 'vibes_no_ads_active';
const LS_NO_ADS_EXPIRES = 'vibes_no_ads_expires';

// ─── Actions ────────────────────────────────────────────────

export const monetizationActions = {
  // IAP status
  setIapStatus(status: 'loading' | 'ready' | 'unavailable'): void {
    monetizationStore.setKey('iapStatus', status);
  },

  setNoAdsProductPrice(price: string | null): void {
    monetizationStore.setKey('noAdsProductPrice', price);
  },

  setPurchaseInProgress(inProgress: boolean): void {
    monetizationStore.setKey('purchaseInProgress', inProgress);
  },

  persistNoAds(): void {
    const { noAdsActive, noAdsExpiresAt } = monetizationStore.get();
    try {
      localStorage.setItem(LS_NO_ADS_ACTIVE, String(noAdsActive));
      localStorage.setItem(LS_NO_ADS_EXPIRES, String(noAdsExpiresAt ?? ''));
    } catch {
      // localStorage unavailable
    }
  },

  loadPersistedNoAds(): void {
    try {
      const active = localStorage.getItem(LS_NO_ADS_ACTIVE);
      const expires = localStorage.getItem(LS_NO_ADS_EXPIRES);
      if (active === 'true' && expires) {
        const expiresAt = parseInt(expires, 10);
        if (!isNaN(expiresAt) && expiresAt > 0) {
          monetizationStore.setKey('noAdsActive', true);
          monetizationStore.setKey('noAdsExpiresAt', expiresAt);
        }
      }
    } catch {
      // localStorage unavailable
    }
  },

  // Persistent
  setNoAds(active: boolean, expiresAt?: number): void {
    monetizationStore.setKey('noAdsActive', active);
    monetizationStore.setKey('noAdsExpiresAt', expiresAt ?? null);
    monetizationActions.persistNoAds();
  },

  checkNoAdsExpiry(): void {
    const { noAdsActive, noAdsExpiresAt } = monetizationStore.get();
    if (noAdsActive && noAdsExpiresAt !== null && Date.now() > noAdsExpiresAt) {
      monetizationStore.setKey('noAdsActive', false);
      monetizationStore.setKey('noAdsExpiresAt', null);
    }
  },

  setPrivacyOptionsRequired(required: boolean): void {
    monetizationStore.setKey('privacyOptionsRequired', required);
  },

  // Ad status (called by AdService only)
  setRewardedAdStatus(status: AdStatus): void {
    monetizationStore.setKey('rewardedAdStatus', status);
  },

  setInterstitialStatus(status: AdStatus): void {
    monetizationStore.setKey('interstitialStatus', status);
  },

  // Session (called by systems)
  setActiveOffer(type: RewardType | null): void {
    monetizationStore.setKey('activeOffer', type);
  },

  setOfferAvailable(available: boolean): void {
    monetizationStore.setKey('offerAvailable', available);
  },

  setOfferGranted(granted: boolean): void {
    monetizationStore.setKey('offerGranted', granted);
  },

  resetOffer(): void {
    monetizationStore.setKey('activeOffer', null);
    monetizationStore.setKey('offerAvailable', false);
    monetizationStore.setKey('offerGranted', false);
  },
};
