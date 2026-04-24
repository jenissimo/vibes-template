export const PRODUCT_NO_ADS = 'vibes_no_ads_30d';
export const NO_ADS_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IAPProduct {
  id: string;
  priceString: string;
  priceMicros: number;
  currencyCode: string;
  title: string;
}

/** expiresAt computation rules:
 *  - purchase():          transaction.purchaseDate + NO_ADS_DURATION_MS
 *  - restorePurchases():  max(all purchaseDates) + NO_ADS_DURATION_MS
 */
export interface PurchaseResult {
  success: boolean;
  /** Unix timestamp ms */
  expiresAt?: number;
  error?: PurchaseError;
}

export interface RestoreResult {
  restored: boolean;
  /** Unix timestamp ms — from max(purchaseDates) + NO_ADS_DURATION_MS */
  expiresAt?: number;
}

export enum PurchaseError {
  Cancelled = 'cancelled',
  NetworkError = 'network_error',
  NotAvailable = 'not_available',
  StoreProblem = 'store_problem',
  AlreadyOwned = 'already_owned',
  Unknown = 'unknown',
}

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IAPService {
  initialize(): Promise<void>;
  getProduct(productId: string): Promise<IAPProduct | null>;
  purchase(productId: string): Promise<PurchaseResult>;
  restorePurchases(): Promise<RestoreResult>;
  dispose(): void;
}
