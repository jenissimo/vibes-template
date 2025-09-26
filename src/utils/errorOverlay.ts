// src/utils/errorOverlay.ts
import { mount, unmount } from 'svelte';
import ErrorOverlay from '@/ui/components/ErrorOverlay.svelte';
import { eventBus } from '@/engine/events/EventBus';

type OverlayKind = 'uncaught' | 'unhandledrejection';

let app: any | null = null;
let container: HTMLElement | null = null;
let visible = false;

declare global {
  interface Window { __errorOverlayHandlersAttached?: boolean }
}

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function isProd() {
  const viteProd = (typeof import.meta !== 'undefined' && (import.meta as any).env?.PROD) ?? false;
  const nodeProd = (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') ?? false;
  return Boolean(viteProd || nodeProd);
}

function normalizeError(reason: unknown): { name: string; message: string; stack?: string } {
  if (reason instanceof Error) return { name: reason.name, message: reason.message, stack: reason.stack ?? '' };
  try {
    const msg = typeof reason === 'string' ? reason : JSON.stringify(reason);
    return { name: 'Error', message: msg };
  } catch {
    return { name: 'Error', message: String(reason) };
  }
}

function ensureContainer(): HTMLElement {
  if (container && document.body.contains(container)) return container;
  container = document.createElement('div');
  container.id = 'error-overlay-container';
  Object.assign(container.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '2147483647',
    pointerEvents: 'none', // Не блокируем события мыши
  } as CSSStyleDeclaration);
  document.body.appendChild(container);
  return container;
}

export function showErrorOverlay(
  errLike: unknown,
  _meta: { kind: OverlayKind } = { kind: 'uncaught' }
): void {
  if (!isBrowser() || isProd()) return;

  const target = ensureContainer();
  const payload = normalizeError(errLike);

  if (!app) {
    // Возвращается объект с экспортами компонента (Svelte 5)
    app = mount(ErrorOverlay, { target });
  }

  // Экспортируемые из компонента методы:
  app?.setError?.(payload);
  app?.show?.();
  visible = true;
}

export function hideErrorOverlay(): void {
  if (!isBrowser()) return;
  if (app) {
    try {
      app?.hide?.();
      unmount(app);
    } catch (error) {
      // Игнорируем ошибки размонтирования
      console.warn('Error unmounting error overlay:', error);
    }
    app = null;
  }
  if (container?.parentNode) {
    try {
      container.parentNode.removeChild(container);
    } catch (error) {
      // Игнорируем ошибки удаления элемента
      console.warn('Error removing error overlay container:', error);
    }
  }
  container = null;
  visible = false;
}

export function isErrorOverlayVisible(): boolean {
  return visible;
}

export function attachGlobalErrorHandlers(): void {
  if (!isBrowser() || isProd()) return;
  if (window.__errorOverlayHandlersAttached) return;
  window.__errorOverlayHandlersAttached = true;

  // Обработка глобальных ошибок JavaScript
  eventBus.on('window-error', (e) => {
    showErrorOverlay(e.error ?? new Error(e.message), { kind: 'uncaught' });
  });
  
  // Обработка необработанных промисов
  eventBus.on('window-unhandledrejection', (e) => {
    showErrorOverlay(e.reason, { kind: 'unhandledrejection' });
  });

  // Обработка ошибок в Svelte компонентах через перехват console.error
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    // Вызываем оригинальный console.error
    originalConsoleError.apply(console, args);
    
    // Проверяем, содержит ли сообщение об ошибке стектрейс Svelte
    const errorMessage = args.join(' ');
    const isSvelteError = errorMessage.includes('in <unknown>') || 
                         errorMessage.includes('.svelte') ||
                         errorMessage.includes('UncaughtException') ||
                         errorMessage.includes('TypeError: Cannot read properties');
    
    if (isSvelteError) {
      // Создаем Error объект из console.error аргументов
      const error = new Error(errorMessage);
      error.stack = args.find(arg => typeof arg === 'string' && arg.includes('at ')) || error.stack;
      
      showErrorOverlay(error, { kind: 'uncaught' });
    }
  };
}
