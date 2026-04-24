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

  purchase(_productId: string): Promise<PurchaseResult> {
    logger.info('MockIAPService.purchase: simulating...', { source: 'iap-mock' });
    return new Promise((resolve) => {
      setTimeout(() => {
        const expiresAt = Date.now() + NO_ADS_DURATION_MS;
        logger.info('MockIAPService.purchase: success', { source: 'iap-mock', expiresAt });
        resolve({ success: true, expiresAt });
      }, 500);
    });
  }

  async restorePurchases(): Promise<RestoreResult> {
    logger.info('MockIAPService.restorePurchases: nothing to restore', { source: 'iap-mock' });
    return { restored: false };
  }

  dispose(): void {
    logger.info('MockIAPService disposed', { source: 'iap-mock' });
  }
}
