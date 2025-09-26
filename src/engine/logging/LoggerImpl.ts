import type { Logger, LogRecord, LogLevel } from './types';
import { LOG_LEVELS } from './types';
import { LogProcessor } from './LogProcessor';

export class LoggerImpl implements Logger {
  private readonly levelValue: number;
  private timers = new Map<string, number>();
  
  constructor(
    private processor: LogProcessor,
    private bindings: Partial<Pick<LogRecord, 'source' | 'fields' | 'tags' | 'traceId'>> = {}
  ) {
    this.levelValue = LOG_LEVELS[processor.config.level];
  }

  child(bindings: Partial<Pick<LogRecord, 'source' | 'fields' | 'tags'>>): Logger {
    const newBindings = {
      ...this.bindings,
      ...bindings,
      fields: { ...this.bindings.fields, ...bindings.fields },
      tags: [...(this.bindings.tags || []), ...(bindings.tags || [])],
    };
    return new LoggerImpl(this.processor, newBindings);
  }
  
  // Единый метод для всех уровней
  log(level: LogLevel, msg: string, fields?: Record<string, unknown>, err?: Error): void {
    if (LOG_LEVELS[level] < this.levelValue) {
      return;
    }

    const record: LogRecord = {
      ts: performance.now(),
      level,
      msg,
      source: this.bindings.source ?? 'engine',
      fields: { ...this.bindings.fields, ...fields },
      tags: this.bindings.tags,
      traceId: this.bindings.traceId,
      err: err ? {
        name: err.name,
        message: err.message,
        stack: err.stack,
        cause: err.cause, // Сохраняем 'cause' как есть
      } : undefined,
    };
    
    this.processor.process(record);
  }

  trace(msg: string, fields?: Record<string, unknown>): void { 
    this.log('trace', msg, fields); 
  }
  
  debug(msg: string, fields?: Record<string, unknown>): void { 
    this.log('debug', msg, fields); 
  }
  
  info(msg: string, fields?: Record<string, unknown>): void { 
    this.log('info', msg, fields); 
  }
  
  warn(msg: string, fields?: Record<string, unknown>): void { 
    this.log('warn', msg, fields); 
  }
  
  // Упростил сигнатуру error/fatal для соответствия популярным API
  error(msg: string, err: Error, fields?: Record<string, unknown>): void { 
    this.log('error', msg, fields, err); 
  }
  
  fatal(msg: string, err: Error, fields?: Record<string, unknown>): void { 
    this.log('fatal', msg, fields, err); 
  }

  time(label: string): void {
    this.timers.set(label, performance.now());
  }

  timeEnd(label: string): void {
    const startTime = this.timers.get(label);
    if (startTime !== undefined) {
      const duration = performance.now() - startTime;
      this.timers.delete(label);
      this.debug(`⏱️ ${label}: ${duration.toFixed(2)}ms`, { duration, label });
    } else {
      this.warn(`Timer '${label}' not found`);
    }
  }

  metric(name: string, value: number, unit?: string, fields: Record<string, unknown> = {}): void {
      this.info(`📊 ${name}: ${value}${unit ? unit : ''}`, {
          ...fields,
          metric: { name, value, unit },
      });
  }

  event(name: string, data?: Record<string, unknown>): void {
      this.info(`🎯 Event: ${name}`, { ...data, event: { name }});
  }
}
