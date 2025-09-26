import type { Logger, LogConfig, LogSink } from './types';
import { LoggerImpl } from './LoggerImpl';
import { LogProcessor } from './LogProcessor';
import { ConsoleSink } from './sinks/ConsoleSink';
import { RingBufferSink } from './sinks/RingBufferSink';
import { ErrorOverlaySink } from './sinks/ErrorOverlaySink';

// 1. Создаем "пустой" логгер, который ничего не делает.
// Он будет использоваться до полной инициализации настоящего логгера.
const noop = () => {};
const createNoopLogger = (): Logger => ({
  child: () => createNoopLogger(),
  log: noop, trace: noop, debug: noop, info: noop, warn: noop, error: noop, fatal: noop,
  time: noop, timeEnd: noop, metric: noop, event: noop,
});

// 2. Создаем proxy. Он изначально использует noop-логгер.
let underlyingLogger: Logger = createNoopLogger();
let ringBufferSink: RingBufferSink | null = null;

export const logger: Logger = new Proxy(underlyingLogger, {
  get(_target, prop: keyof Logger) {
    // Важно: мы проксируем не `target`, а `underlyingLogger`,
    // который может измениться после инициализации.
    return underlyingLogger[prop];
  }
}) as Logger;

// Экспортируем ringBuffer для ErrorOverlay
export const ringBuffer = {
  getRecent: (count: number) => ringBufferSink?.getRecent(count) || []
};

// 3. Функция инициализации, которая заменит noop-логгер на настоящий.
// Вызывается в точке входа вашего приложения (например, main.ts).
export function initializeLogger(config: Partial<LogConfig> = {}) {
  const isDev = import.meta.env.DEV;

  // Создаем RingBufferSink и сохраняем ссылку для экспорта
  ringBufferSink = new RingBufferSink(1000);
  
  const sinks: LogSink[] = [
    // В dev-режиме выводим всё в консоль для удобной отладки
    ...(isDev ? [new ConsoleSink()] : []),
    // Всегда ведем "чёрный ящик" последних событий
    ringBufferSink,
    // Показываем ошибки в ErrorOverlay
    new ErrorOverlaySink(),
  ];
  
  const finalConfig: LogConfig = {
    level: isDev ? 'trace' : 'info',
    sinks,
    enableGlobalHandlers: true,
    ...config,
  };
  
  const processor = new LogProcessor(finalConfig);
  underlyingLogger = new LoggerImpl(processor, { source: 'engine' });

  if (finalConfig.enableGlobalHandlers) {
    installGlobalErrorHandlers(underlyingLogger);
  }

  underlyingLogger.info('Logger initialized', {
     level: finalConfig.level,
     sinks: finalConfig.sinks.map(s => s.constructor.name) 
  });
}

// 4. Установщик глобальных обработчиков ошибок
function installGlobalErrorHandlers(log: Logger) {
  const handleUncaughtError = (err: Error, context: Record<string, unknown>) => {
    log.fatal('UncaughtException', err, context);
  };
  
  window.addEventListener('error', (ev: ErrorEvent) => {
    handleUncaughtError(ev.error || new Error(ev.message), { 
      kind: 'error',
      filename: ev.filename, 
      line: ev.lineno, 
      col: ev.colno 
    });
  });

  window.addEventListener('unhandledrejection', (ev: PromiseRejectionEvent) => {
    const reason = ev.reason;
    const err = reason instanceof Error ? reason : new Error(String(reason));
    handleUncaughtError(err, { kind: 'unhandledrejection' });
  });
}

// 5. Полезные утилиты и декораторы

/** Декоратор для автоматического замера времени выполнения метода */
export function timed(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  descriptor.value = function (...args: any[]) {
    const FQN = `${target.constructor.name}.${propertyName}`;
    logger.time(FQN);
    try {
      const result = originalMethod.apply(this, args);
      // Если метод асинхронный, дожидаемся его завершения
      if (result instanceof Promise) {
        return result.finally(() => { logger.timeEnd(FQN); });
      }
      logger.timeEnd(FQN);
      return result;
    } catch (error) {
       // Убедимся, что таймер завершается даже при ошибке
      logger.timeEnd(FQN);
      throw error;
    }
  };
}

// Экспортируем типы для удобства
export type { Logger, LogConfig, LogRecord, LogLevel, LogSource } from './types';
export { LOG_LEVELS } from './types';
export { ConsoleSink } from './sinks/ConsoleSink';
export { RingBufferSink } from './sinks/RingBufferSink';
export { ErrorOverlaySink } from './sinks/ErrorOverlaySink';
