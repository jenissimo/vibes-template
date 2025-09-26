import type { LogSink, LogRecord, LogLevel } from '../types';

export class ConsoleSink implements LogSink {
  private levelColors: Record<LogLevel, string> = {
    trace: '#6B7280', // gray-500
    debug: '#3B82F6', // blue-500
    info: '#22C55E', // green-500
    warn: '#F59E0B', // amber-500
    error: '#EF4444', // red-500
    fatal: '#DC2626', // red-600
  };

  write(batch: LogRecord[]): void {
    for (const record of batch) {
      const { level, source, msg, fields, err, ts } = record;
      
      const styles = `color: ${this.levelColors[level]}; font-weight: bold;`;
      const time = `[${ts.toFixed(2)}ms]`;
      const prefix = `%c[${source.toUpperCase()}]`;

      const args: unknown[] = [ `${prefix} ${msg} ${time}`, styles ];
      
      const data = { ...fields };
      
      if (err) {
        data.error = { name: err.name, message: err.message, stack: err.stack, cause: err.cause };
      }

      if (Object.keys(data).length > 0) {
        args.push(data);
      }
      
      // Выбираем правильный метод console, fatal -> error
      const consoleMethod = level === 'fatal' ? 'error' : level;
      console[consoleMethod](...args);
    }
  }

  async flush(): Promise<void> {
    // Console doesn't need flushing
  }

  async destroy(): Promise<void> {
    // Console doesn't need cleanup
  }
}
