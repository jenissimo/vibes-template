/**
 * Panel Positioning Service - позиционирование UI панелей с учётом safe-area
 */

import type { LayoutResult, Anchor } from '@/engine/render';
import { placeAnchoredCentered } from '@/engine/render/LayoutEngine';

import { logger } from '@/engine/logging';
import { RENDER_CONFIG } from '../render/RenderConfig';
export interface PanelConfig {
  id: string;
  anchor: Anchor;
  offsetX?: number;
  offsetY?: number;
  element?: HTMLElement;
}

export class PanelPositioningService {
  private panels = new Map<string, PanelConfig>();
  private currentLayout: LayoutResult | null = null;
  private resizeHandler: (() => void) | null = null;

  /**
   * Регистрация панели для позиционирования
   */
  registerPanel(config: PanelConfig): void {
    // Проверяем, не зарегистрирована ли уже панель с таким ID
    if (this.panels.has(config.id)) {
      logger.warn(`Panel ${config.id} already registered, updating instead`, { source: 'game' });
      this.updatePanel(config);
      return;
    }

    this.panels.set(config.id, config);
    this.updatePanelPosition(config.id);
    
    // Добавляем fallback обработчик ресайза при первой регистрации панели
    this.ensureResizeHandler();
  }

  /**
   * Обновление конфигурации панели
   */
  updatePanel(config: Partial<PanelConfig> & { id: string }): void {
    const existing = this.panels.get(config.id);
    if (existing) {
      const updated = { ...existing, ...config };
      this.panels.set(config.id, updated);
      this.updatePanelPosition(config.id);
    }
  }

  /**
   * Удаление панели
   */
  unregisterPanel(id: string): void {
    this.panels.delete(id);
  }

  hasPanel(id: string): boolean {
    return this.panels.has(id);
  }

  /**
   * Обновление layout'а и пересчёт позиций всех панелей
   */
  updateLayout(layout: LayoutResult): void {
    this.currentLayout = layout;
    this.panels.forEach((_, id) => this.updatePanelPosition(id));
  }

  /**
   * Позиционирование конкретной панели
   */
  private updatePanelPosition(panelId: string): void {
    const panel = this.panels.get(panelId);
    if (!panel || !panel.element || !this.currentLayout) return;

    // Проверяем, что элемент все еще в DOM
    if (!document.contains(panel.element)) {
      logger.warn(`Panel ${panelId} element is not in DOM, removing from service`, { source: 'game' });
      this.panels.delete(panelId);
      return;
    }

    const { anchor, offsetX = 0, offsetY = 0 } = panel;
    const { safe } = this.currentLayout;

    // Получаем размеры элемента с retry для хот-релоада
    const rect = panel.element.getBoundingClientRect();
    let elementWidth = rect.width;
    let elementHeight = rect.height;

    // Если размеры нулевые (часто при хот-релоаде), ждем следующий кадр
    if (elementWidth === 0 || elementHeight === 0) {
      logger.debug(`Panel ${panelId} has zero dimensions, retrying next frame`, { source: 'game' });
      requestAnimationFrame(() => this.updatePanelPosition(panelId));
      return;
    }

    // Вычисляем позицию с учётом safe area используя LayoutEngine
    const position = placeAnchoredCentered(anchor, safe, 1.0, elementWidth, elementHeight, offsetX, offsetY);
    
    // Применяем позицию
    panel.element.style.position = 'fixed';
    panel.element.style.left = `${position.x}px`;
    panel.element.style.top = `${position.y}px`;
    panel.element.style.right = 'auto';
    panel.element.style.bottom = 'auto';
    panel.element.style.transform = 'none';

    logger.info(`📐 Panel ${panelId} positioned at (${position.x}, ${position.y}) with anchor ${anchor}`, { source: 'game' });
  }

  refreshPanel(id: string): void {
    this.updatePanelPosition(id);
  }

  refreshAll(): void {
    this.panels.forEach((_, id) => this.updatePanelPosition(id));
  }


  /**
   * Получение текущих позиций всех панелей (для отладки)
   */
  getPanelPositions(): Record<string, { x: number; y: number; anchor: Anchor }> {
    const positions: Record<string, { x: number; y: number; anchor: Anchor }> = {};
    
    this.panels.forEach((panel, id) => {
      if (panel.element) {
        const rect = panel.element.getBoundingClientRect();
        positions[id] = {
          x: rect.left,
          y: rect.top,
          anchor: panel.anchor
        };
      }
    });
    
    return positions;
  }

  /**
   * Обеспечиваем наличие fallback обработчика ресайза
   */
  private ensureResizeHandler(): void {
    if (this.resizeHandler) return;
    
    this.resizeHandler = () => {
      // Fallback: если layout не обновился через EventBus, обновляем вручную
      if (this.panels.size > 0) {
        logger.debug('🔄 Fallback resize handler triggered', { source: 'game' });
        this.forceUpdateAllPanels();
      }
    };
    
    window.addEventListener('resize', this.resizeHandler);
    logger.debug('📐 Added fallback resize handler', { source: 'game' });
  }

  /**
   * Принудительное обновление всех панелей (fallback)
   */
  private forceUpdateAllPanels(): void {
    if (this.panels.size === 0) return;
    
    // Получаем текущие размеры экрана и insets
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const insets = this.readSafeInsets();
    
    // Вычисляем новый layout
    const newLayout = this.computeLayout(screenW, screenH, insets);
    
    // Обновляем все панели
    this.updateLayout(newLayout);
  }

  /**
   * Чтение safe-area insets (копия из LayoutEngine)
   */
  private readSafeInsets(): { top: number; right: number; bottom: number; left: number } {
    const el = document.getElementById('safe-probe');
    if (!el) {
      return { top: 20, right: 16, bottom: 20, left: 16 };
    }
    
    const cs = getComputedStyle(el);
    const toPx = (s: string) => {
      const value = parseFloat(s || '0');
      return isNaN(value) || !isFinite(value) ? 0 : value;
    };
    
    return {
      top: toPx(cs.paddingTop),
      right: toPx(cs.paddingRight),
      bottom: toPx(cs.paddingBottom),
      left: toPx(cs.paddingLeft),
    };
  }

  /**
   * Вычисление layout (копия из LayoutEngine)
   */
  private computeLayout(screenW: number, screenH: number, insets: { top: number; right: number; bottom: number; left: number }): LayoutResult {
    const safeW = screenW - insets.left - insets.right;
    const safeH = screenH - insets.top - insets.bottom;

    // Game layer - fit в safe area
    const { referenceResolution } = RENDER_CONFIG;
    const scaleGame = Math.min(safeW / referenceResolution.w, safeH / referenceResolution.h);
    const game: { x: number; y: number; w: number; h: number } = {
      w: referenceResolution.w * scaleGame,
      h: referenceResolution.h * scaleGame,
      x: insets.left + (safeW - referenceResolution.w * scaleGame) / 2,
      y: insets.top + (safeH - referenceResolution.h * scaleGame) / 2
    };

    // Background layer - покрывает весь экран
    const bg: { x: number; y: number; w: number; h: number } = {
      w: screenW,
      h: screenH,
      x: 0,
      y: 0
    };

    const safe: { x: number; y: number; w: number; h: number } = { 
      x: insets.left, 
      y: insets.top, 
      w: safeW, 
      h: safeH 
    };
    
    return { 
      bg, 
      game, 
      safe, 
      scaleGame, 
      scaleBg: 1.0, 
      scaleUI: 1.0 
    };
  }

  /**
   * Полная очистка сервиса (для хот-релоада)
   */
  clearAll(): void {
    logger.info('🧹 Clearing all panels from positioning service', { source: 'game' });
    this.panels.clear();
    this.currentLayout = null;
    
    // Удаляем fallback обработчик
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
  }

  /**
   * Очистка неактивных панелей (элементы не в DOM)
   */
  cleanupInactivePanels(): void {
    const inactivePanels: string[] = [];
    
    this.panels.forEach((panel, id) => {
      if (!panel.element || !document.contains(panel.element)) {
        inactivePanels.push(id);
      }
    });
    
    inactivePanels.forEach(id => {
      logger.debug(`Removing inactive panel: ${id}`, { source: 'game' });
      this.panels.delete(id);
    });
    
    if (inactivePanels.length > 0) {
      logger.info(`🧹 Cleaned up ${inactivePanels.length} inactive panels`, { source: 'game' });
    }
  }
}

// Глобальный экземпляр сервиса
export const panelPositioningService = new PanelPositioningService();
