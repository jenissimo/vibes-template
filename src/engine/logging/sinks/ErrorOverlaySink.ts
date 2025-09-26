import type { LogSink, LogRecord } from '../types';
import { showErrorOverlay } from '@/utils/errorOverlay';

/**
 * Sink для показа ошибок в ErrorOverlay
 * Показывает только error и fatal уровни
 */
export class ErrorOverlaySink implements LogSink {
  write(batch: LogRecord[]): void {
    for (const record of batch) {
      const { level, err } = record;
      
      // Показываем ErrorOverlay только для ошибок и фатальных ошибок
      if ((level === 'error' || level === 'fatal') && err) {
        // Создаем Error объект из данных лога
        const error = new Error(err.message);
        error.name = err.name;
        error.stack = err.stack;
        if (err.cause) {
          error.cause = err.cause;
        }
        
        showErrorOverlay(error, { kind: 'uncaught' });
      }
    }
  }

  async flush(): Promise<void> {
    // ErrorOverlay не требует flush
  }

  async destroy(): Promise<void> {
    // ErrorOverlay не требует cleanup
  }
}
