import type { LogRecord, LogConfig } from './types';

export class LogProcessor {
  private rateLimiters = new Map<string, { count: number; resetTime: number }>();

  constructor(public config: LogConfig) {}

  process(record: LogRecord): void {
    // Rate limiting
    if (record.rateKey && this.config.rateLimits?.[record.rateKey]) {
      const now = Date.now();
      const limitConfig = this.config.rateLimits[record.rateKey];
      let limiter = this.rateLimiters.get(record.rateKey);

      if (!limiter || now > limiter.resetTime) {
        limiter = { count: 0, resetTime: now + 1000 };
        this.rateLimiters.set(record.rateKey, limiter);
      }
      
      if (limiter.count >= limitConfig.maxPerSec) {
        return; // Drop message
      }
      limiter.count++;
    }

    // Redact PII
    const finalRecord = this.config.redact ? this.config.redact(record) : record;

    // Send to all sinks
    for (const sink of this.config.sinks) {
      sink.write([finalRecord]);
    }
  }
}
