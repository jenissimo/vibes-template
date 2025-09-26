export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export const LOG_LEVELS: Record<LogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

export type LogSource =
  | 'engine'
  | 'ecs'
  | 'render'
  | 'audio'
  | 'ui'
  | 'input'
  | 'assets'
  | 'network'
  | 'platform'
  | 'gpu'
  | 'memory'
  | 'performance';

export interface LogRecord {
  ts: number; // timestamp (performance.now())
  level: LogLevel;
  source: LogSource;
  msg: string;
  fields?: Record<string, unknown>;
  tags?: string[];
  rateKey?: string;
  traceId?: string;
  spanId?: string;
  err?: { name: string; message: string; stack?: string; cause?: unknown };
}

export interface LogSink {
  write(batch: LogRecord[]): void;
  flush?(): Promise<void>;
  destroy?(): Promise<void>;
}

export interface LogConfig {
  level: LogLevel;
  sinks: LogSink[];
  redact?: (r: LogRecord) => LogRecord;
  rateLimits?: { [rateKey: string]: { maxPerSec: number } };
  enableGlobalHandlers?: boolean;
}

export interface Logger {
  child(bindings: Partial<Pick<LogRecord, 'source' | 'fields' | 'tags'>>): Logger;
  log(level: LogLevel, msg: string, fields?: Record<string, unknown>, err?: Error): void;

  trace(msg: string, fields?: Record<string, unknown>): void;
  debug(msg: string, fields?: Record<string, unknown>): void;
  info(msg: string, fields?: Record<string, unknown>): void;
  warn(msg: string, fields?: Record<string, unknown>): void;
  error(msg: string, err: Error, fields?: Record<string, unknown>): void;
  fatal(msg: string, err: Error, fields?: Record<string, unknown>): void;

  time(label: string): void;
  timeEnd(label: string): void;

  metric(name: string, value: number, unit?: string, fields?: Record<string, unknown>): void;
  event(name: string, data?: Record<string, unknown>): void;
}
