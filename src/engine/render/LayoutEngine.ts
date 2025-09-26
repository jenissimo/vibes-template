import { logger } from '@/engine/logging';
import { RENDER_CONFIG } from '@/engine/render/RenderConfig';
/**
 * Layout Engine - система лейаутинга для адаптивного UI
 * Поддерживает safe-area, якоря и масштабирование
 */

export type Insets = { top: number; right: number; bottom: number; left: number };
export type Rect = { x: number; y: number; w: number; h: number };
export type Anchor = 'TL' | 'T' | 'TR' | 'L' | 'C' | 'R' | 'BL' | 'B' | 'BR';

// Референсное разрешение (дизайн-пиксели)
// export const REF = { w: 1000, h: 2000 };

export interface LayoutResult {
  bg: Rect;
  game: Rect;
  safe: Rect;
  scaleGame: number;
  scaleBg: number;
  scaleUI: number;
}

/**
 * Вычисление лейаута для всех слоёв
 */
export function computeLayout(screenW: number, screenH: number, insets: Insets): LayoutResult {
  const safeW = screenW - insets.left - insets.right;
  const safeH = screenH - insets.top - insets.bottom;

  logger.info(`📐 Layout computation: screen=${screenW}x${screenH}, insets=${JSON.stringify(insets)}, safe=${safeW}x${safeH}`, { source: 'game' });

  // Game layer - fit в safe area
  const { referenceResolution } = RENDER_CONFIG;
  const scaleGame = Math.min(safeW / referenceResolution.w, safeH / referenceResolution.h);
  const game: Rect = {
    w: referenceResolution.w * scaleGame,
    h: referenceResolution.h * scaleGame,
    x: insets.left + (safeW - referenceResolution.w * scaleGame) / 2,
    y: insets.top + (safeH - referenceResolution.h * scaleGame) / 2
  };

  // Background layer - покрывает весь экран без масштабирования
  const bg: Rect = {
    w: screenW,
    h: screenH,
    x: 0,
    y: 0
  };
  const scaleBg = 1.0; // Фон не масштабируется, только ресайзится

  const safe: Rect = { x: insets.left, y: insets.top, w: safeW, h: safeH };
  
  // UI scale - фиксированный размер, не масштабируется
  const scaleUI = 1.0;

  const result = { bg, game, safe, scaleGame, scaleBg, scaleUI };
  logger.info(`📐 Layout result: safe=(${safe.x}, ${safe.y}, ${safe.w}, ${safe.h}), scaleUI=${scaleUI.toFixed(3)} (fixed)`, { source: 'game' });
  logger.info(`📐 Background: (${bg.x}, ${bg.y}, ${bg.w}, ${bg.h}), scale=${scaleBg.toFixed(3)}`, { source: 'game' });
  logger.info(`📐 Game: (${game.x}, ${game.y}, ${game.w}, ${game.h}), scale=${scaleGame.toFixed(3)}`, { source: 'game' });
  
  return result;
}

/**
 * Размещение UI элемента по якорю (для левого верхнего угла)
 */
export function placeAnchored(
  anchor: Anchor,
  safe: Rect,
  _scaleUI: number, // Не используется, но оставляем для совместимости API
  offsetX: number = 0,
  offsetY: number = 0
): { x: number; y: number } {
  let x = 0, y = 0;
  // UI не масштабируется - offset'ы остаются в пикселях
  const ox = offsetX;
  const oy = offsetY;

  switch (anchor) {
    case 'TL': x = safe.x + ox;              y = safe.y + oy;              break;
    case 'T':  x = safe.x + safe.w/2 + ox;   y = safe.y + oy;              break;
    case 'TR': x = safe.x + safe.w - ox;     y = safe.y + oy;              break;
    case 'L':  x = safe.x + ox;              y = safe.y + safe.h/2 + oy;   break;
    case 'C':  x = safe.x + safe.w/2 + ox;   y = safe.y + safe.h/2 + oy;   break;
    case 'R':  x = safe.x + safe.w - ox;     y = safe.y + safe.h/2 + oy;   break;
    case 'BL': x = safe.x + ox;              y = safe.y + safe.h - oy;     break;
    case 'B':  x = safe.x + safe.w/2 + ox;   y = safe.y + safe.h - oy;     break;
    case 'BR': x = safe.x + safe.w - ox;     y = safe.y + safe.h - oy;     break;
  }
  
  return { x, y };
}

/**
 * Размещение UI элемента по якорю (якорь указывает на левый верхний угол элемента)
 */
export function placeAnchoredCentered(
  anchor: Anchor,
  safe: Rect,
  _scaleUI: number, // Не используется, но оставляем для совместимости API
  elementWidth: number,
  elementHeight: number,
  offsetX: number = 0,
  offsetY: number = 0
): { x: number; y: number } {
  let x = 0, y = 0;
  // UI не масштабируется - offset'ы остаются в пикселях
  const ox = offsetX;
  const oy = offsetY;

  switch (anchor) {
    case 'TL': x = safe.x + ox;                          y = safe.y + oy;                          break;
    case 'T':  x = safe.x + safe.w/2 - elementWidth/2 + ox;  y = safe.y + oy;                      break;
    case 'TR': x = safe.x + safe.w - elementWidth - ox;  y = safe.y + oy;                          break;
    case 'L':  x = safe.x + ox;                          y = safe.y + safe.h/2 - elementHeight/2 + oy; break;
    case 'C':  x = safe.x + safe.w/2 - elementWidth/2 + ox;  y = safe.y + safe.h/2 - elementHeight/2 + oy; break;
    case 'R':  x = safe.x + safe.w - elementWidth - ox;  y = safe.y + safe.h/2 - elementHeight/2 + oy; break;
    case 'BL': x = safe.x + ox;                          y = safe.y + safe.h - elementHeight - oy;  break;
    case 'B':  x = safe.x + safe.w/2 - elementWidth/2 + ox;  y = safe.y + safe.h - elementHeight - oy;  break;
    case 'BR': x = safe.x + safe.w - elementWidth - ox;  y = safe.y + safe.h - elementHeight - oy;  break;
  }
  
  return { x, y };
}

/**
 * Чтение safe-area insets из CSS с fallback на дефолтные значения
 */
export function readSafeInsets(): Insets {
  const el = document.getElementById('safe-probe');
  if (!el) {
    logger.warn('Safe-area probe element not found, using default insets', { source: 'game' });
    return getDefaultInsets();
  }
  
  const cs = getComputedStyle(el);
  const toPx = (s: string) => {
    const value = parseFloat(s || '0');
    // Проверяем, что значение не NaN и не Infinity
    return isNaN(value) || !isFinite(value) ? 0 : value;
  };
  
  const insets = {
    top: toPx(cs.paddingTop),
    right: toPx(cs.paddingRight),
    bottom: toPx(cs.paddingBottom),
    left: toPx(cs.paddingLeft),
  };
  
  // Дополнительная проверка: если все insets равны 0, используем дефолтные значения
  const allZero = insets.top === 0 && insets.right === 0 && insets.bottom === 0 && insets.left === 0;
  if (allZero) {
    logger.warn(`📐 All safe-area insets are zero - using default fallback values`, { source: 'game' });
    return getDefaultInsets();
  }
  
  logger.info(`📐 Safe-area insets: top=${insets.top}, right=${insets.right}, bottom=${insets.bottom}, left=${insets.left}`, { source: 'game' });
  return insets;
}

/**
 * Получение дефолтных safe area insets из CSS переменных
 */
function getDefaultInsets(): Insets {
  // Читаем дефолтные значения из CSS переменных
  const rootStyle = getComputedStyle(document.documentElement);
  const toPx = (varName: string, fallback: number) => {
    const value = rootStyle.getPropertyValue(varName).trim();
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
  };
  
  const insets = {
    top: toPx('--default-safe-top', 20),
    right: toPx('--default-safe-right', 16),
    bottom: toPx('--default-safe-bottom', 20),
    left: toPx('--default-safe-left', 16),
  };
  
  logger.info(`📐 Using default safe insets: top=${insets.top}, right=${insets.right}, bottom=${insets.bottom}, left=${insets.left}`, { source: 'game' });
  return insets;
}

/**
 * Создание safe-area probe элемента
 */
export function createSafeAreaProbe(): void {
  if (document.getElementById('safe-probe')) return;
  
  const probe = document.createElement('div');
  probe.id = 'safe-probe';
  probe.style.cssText = `
    position: fixed;
    inset: 0;
    padding-top: env(safe-area-inset-top, 0px);
    padding-right: env(safe-area-inset-right, 0px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
    padding-left: env(safe-area-inset-left, 0px);
    visibility: hidden;
    pointer-events: none;
    z-index: -1;
  `;
  document.body.appendChild(probe);
  
  logger.info(`📐 Safe-area probe element created`, { source: 'game' });
}

/**
 * Debug overlay для отладки лейаута
 */
export function createDebugOverlay(layout: LayoutResult): HTMLElement {
  const overlay = document.createElement('div');
  overlay.id = 'layout-debug';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
    font-family: monospace;
    font-size: 12px;
    color: white;
  `;
  
  const info = document.createElement('div');
  info.style.cssText = `
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(0,0,0,0.8);
    padding: 10px;
    border-radius: 4px;
  `;
  
  // Получаем текущие insets для отображения
  const currentInsets = readSafeInsets();
  
  info.innerHTML = `
    <div>Screen: ${window.innerWidth}×${window.innerHeight}</div>
    <div>Safe Insets: T${currentInsets.top} R${currentInsets.right} B${currentInsets.bottom} L${currentInsets.left}</div>
    <div>Safe Area: ${layout.safe.w.toFixed(0)}×${layout.safe.h.toFixed(0)} at (${layout.safe.x.toFixed(0)}, ${layout.safe.y.toFixed(0)})</div>
    <div>Game: ${layout.game.w.toFixed(0)}×${layout.game.h.toFixed(0)} at (${layout.game.x.toFixed(0)}, ${layout.game.y.toFixed(0)})</div>
    <div>Scale Game: ${layout.scaleGame.toFixed(3)}</div>
    <div>Scale UI: ${layout.scaleUI.toFixed(3)}</div>
    <div>User Agent: ${navigator.userAgent.includes('iPhone') ? 'iPhone' : navigator.userAgent.includes('iPad') ? 'iPad' : 'Other'}</div>
  `;
  
  overlay.appendChild(info);
  
  // Рамки для визуализации зон
  const zones = ['bg', 'game', 'safe'];
  const colors = ['rgba(255,0,0,0.3)', 'rgba(0,255,0,0.3)', 'rgba(0,0,255,0.3)'];
  
  zones.forEach((zone, i) => {
    const rect = layout[zone as keyof LayoutResult] as Rect;
    const zoneEl = document.createElement('div');
    zoneEl.style.cssText = `
      position: absolute;
      left: ${rect.x}px;
      top: ${rect.y}px;
      width: ${rect.w}px;
      height: ${rect.h}px;
      border: 2px solid ${colors[i]};
      background: ${colors[i]};
    `;
    overlay.appendChild(zoneEl);
  });
  
  return overlay;
}

/**
 * Глобальная функция для включения debug overlay (для тестирования)
 */
export function enableLayoutDebug(): void {
  // Проверяем, есть ли уже debug overlay
  const existing = document.getElementById('layout-debug');
  if (existing) {
    existing.remove();
    return;
  }
  
  // Создаем новый layout для debug overlay
  const insets = readSafeInsets();
  const layout = computeLayout(window.innerWidth, window.innerHeight, insets);
  const debugOverlay = createDebugOverlay(layout);
  document.body.appendChild(debugOverlay);
  
  logger.info(`📐 Layout debug overlay enabled`, { source: 'game' });
}

// Добавляем функцию в глобальный объект для легкого доступа из консоли
(window as any).enableLayoutDebug = enableLayoutDebug;
