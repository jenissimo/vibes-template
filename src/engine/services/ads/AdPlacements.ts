/**
 * Generic placement examples. Games should define their own placement constants
 * (e.g. `as const` object) matching their UX surfaces, then pass those strings to
 * `MonetizationService.offerReward` / `tryShowInterstitial`.
 */
export const AdPlacements = {
  RewardedGeneric: 'rewarded_generic',
  InterstitialLevelEnd: 'interstitial_level_end',
  InterstitialMenu: 'interstitial_menu',
} as const;

export type AdPlacement = string;
