import * as PIXI from 'pixi.js';

/**
 * Константы слоев для централизованного управления z-index
 * Все z-index значения должны браться отсюда, а не хардкодиться
 */
export const LAYER_DEPTHS = {
  // Основные слои (базовые контейнеры)
  BACKGROUND: 0,
  GAME: 100,
  UI: 1000,
  PARTICLES: 2000,
  // Debug и overlay
  DEBUG: 9999,
} as const;

export type LayerDepth = typeof LAYER_DEPTHS[keyof typeof LAYER_DEPTHS];

/**
 * Менеджер слоев для управления z-index и контейнерами
 * Централизует всю логику работы со слоями
 */
export class LayerManager {
  private layers = new Map<LayerDepth, PIXI.Container>();
  private parentContainer: PIXI.Container;
  
  constructor(parentContainer: PIXI.Container) {
    this.parentContainer = parentContainer;
    this.initializeLayers();
  }
  
  /**
   * Инициализация всех слоев
   */
  private initializeLayers(): void {
    // Создаем контейнеры для каждого слоя
    Object.values(LAYER_DEPTHS).forEach(depth => {
      const container = new PIXI.Container();
      container.zIndex = depth;
      this.layers.set(depth, container);
      this.parentContainer.addChild(container);
    });
    
    // Сортируем по z-index для правильного порядка отрисовки
    this.parentContainer.sortChildren();
  }
  
  /**
   * Получить контейнер для указанного слоя
   */
  getLayer(depth: LayerDepth): PIXI.Container {
    const container = this.layers.get(depth);
    if (!container) {
      throw new Error(`Layer with depth ${depth} not found!`);
    }
    return container;
  }
  
  /**
   * Добавить объект на указанный слой
   */
  addToLayer(depth: LayerDepth, child: PIXI.Container): void {
    const container = this.getLayer(depth);
    container.addChild(child);
  }
  
  /**
   * Удалить объект с указанного слоя
   */
  removeFromLayer(depth: LayerDepth, child: PIXI.Container): void {
    const container = this.getLayer(depth);
    if (container.children.includes(child)) {
      container.removeChild(child);
    }
  }
  
  /**
   * Переместить объект на другой слой
   */
  moveToLayer(fromDepth: LayerDepth, toDepth: LayerDepth, child: PIXI.Container): void {
    this.removeFromLayer(fromDepth, child);
    this.addToLayer(toDepth, child);
  }
  
  /**
   * Получить все объекты на слое
   */
  getLayerChildren(depth: LayerDepth): PIXI.Container[] {
    return this.getLayer(depth).children;
  }
  
  /**
   * Очистить слой
   */
  clearLayer(depth: LayerDepth): void {
    const container = this.getLayer(depth);
    container.removeChildren();
  }
  
  /**
   * Установить видимость слоя
   */
  setLayerVisible(depth: LayerDepth, visible: boolean): void {
    const container = this.getLayer(depth);
    container.visible = visible;
  }
  
  /**
   * Установить альфу слоя
   */
  setLayerAlpha(depth: LayerDepth, alpha: number): void {
    const container = this.getLayer(depth);
    container.alpha = alpha;
  }
  
  /**
   * Получить информацию о всех слоях (для дебага)
   */
  getLayersInfo(): Array<{ depth: LayerDepth; childrenCount: number; visible: boolean }> {
    return Array.from(this.layers.entries()).map(([depth, container]) => ({
      depth,
      childrenCount: container.children.length,
      visible: container.visible
    }));
  }
  
  /**
   * Сортировать все слои по z-index
   */
  sortLayers(): void {
    this.parentContainer.sortChildren();
  }
}
