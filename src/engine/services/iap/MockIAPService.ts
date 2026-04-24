import { logger } from '@/engine/logging';
import type { IAPService, IAPProduct, PurchaseResult, RestoreResult } from './IAPService';
import { NO_ADS_DURATION_MS } from './IAPService';

export class MockIAPService implements IAPService {
  async initialize(): Promise<void> {
    logger.info('MockIAPService initialized', { source: 'iap-mock' });
  }

  async getProduct(_productId: string): Promise<IAPProduct | null> {
    logger.info('MockIAPService.getProduct', { source: 'iap-mock' });
    return {
      id: 'mock_no_ads',
      priceString: '$2.99',
      priceMicros: 2_990_000,
      currencyCode: 'USD',
      title: 'No Ads (30 days)',
    };
  }

  async purchase(_productId: string): Promise<PurchaseResult> {
    logger.info('MockIAPService.purchase: simulating...', { source: 'iap-mock' });
    await new Promise((resolve) => setTimeout(resolve, 500));
    const expiresAt = Date.now() + NO_ADS_DURATION_MS;
    logger.info('MockIAPService.purchase: success', { source: 'iap-mock', expiresAt });
    return { success: true, expiresAt };
  }

  async restorePurchases(): Promise<RestoreResult> {
    logger.info('MockIAPService.restorePurchases: nothing to restore', { source: 'iap-mock' });
    return { restored: false };
  }

  dispose(): void {
    logger.info('MockIAPService disposed', { source: 'iap-mock' });
  }
}
