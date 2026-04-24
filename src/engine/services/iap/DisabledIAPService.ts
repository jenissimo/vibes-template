import { logger } from '@/engine/logging';
import type { IAPService, IAPProduct, PurchaseResult, RestoreResult } from './IAPService';
import { PurchaseError } from './IAPService';

export class DisabledIAPService implements IAPService {
  async initialize(): Promise<void> {
    logger.warn('DisabledIAPService: IAP unavailable', { source: 'iap' });
  }

  async getProduct(_productId: string): Promise<IAPProduct | null> {
    return null;
  }

  async purchase(_productId: string): Promise<PurchaseResult> {
    return { success: false, error: PurchaseError.NotAvailable };
  }

  async restorePurchases(): Promise<RestoreResult> {
    return { restored: false };
  }

  dispose(): void {
    // nothing to clean up
  }
}
