// engine/components/PixiSpriteRenderer.ts
import { Component } from '../Component';
import * as PIXI from 'pixi.js';
import type { ITweenable } from './ITweenable';

export type VisibilityBinding = 'inherit' | 'manual' | 'and' | 'or';

export interface SpriteRendererConfig {
  texture?: PIXI.Texture;
  x?: number;
  y?: number;
  offsetX?: number;
  offsetY?: number;
  scale?: number;
  rotation?: number;
  alpha?: number;
  tint?: number;
  anchor?: { x: number; y: number };
  visible?: boolean;
  visibilityBinding?: VisibilityBinding;
  filters?: PIXI.Filter[];
}

/**
 * Компонент для рендеринга PixiJS спрайтов
 * Автоматически управляет добавлением/удалением спрайта из контейнера
 */
export class PixiSpriteRenderer extends Component implements ITweenable {
  public sprite: PIXI.Sprite;
  protected pixiContainer: PIXI.Container | null;
  protected config: SpriteRendererConfig;
  private _localVisible: boolean;
  private _binding: VisibilityBinding;

  constructor(pixiContainer: PIXI.Container | null, config: SpriteRendererConfig) {
    super();
    this.pixiContainer = pixiContainer;
    this.config = {
      x: 0,
      y: 0,
      offsetX: 0,
      offsetY: 0,
      scale: 1,
      rotation: 0,
      alpha: 1,
      tint: 0xffffff,
      anchor: { x: 0.5, y: 0.5 },
      visible: true,
      visibilityBinding: 'inherit',
      ...config
    };

    this._localVisible = !!this.config.visible;
    this._binding = this.config.visibilityBinding!;
    this.sprite = new PIXI.Sprite(this.config.texture || PIXI.Texture.WHITE);
    this.applyConfig();
    
    // Применяем фильтры если есть
    if (this.config.filters) {
      this.sprite.filters = this.config.filters;
    }
  }

  onAdded() {
    if (this.pixiContainer) {
      this.pixiContainer.addChild(this.sprite);
    }
    // Синхронизируем позицию с GameObject при добавлении
    this.syncWithGameObject();
  }

  onRemoved() {
    if (this.sprite.parent) {
      this.sprite.parent.removeChild(this.sprite);
    }
  }

  update(deltaTime: number) {
    // Синхронизируем с трансформацией родительского GameObject
    this.syncWithGameObject();
    
    // Обновляем фильтры, если у них есть метод update
    if (this.config.filters) {
      this.config.filters.forEach(filter => {
        if (typeof (filter as any).update === 'function') {
          (filter as any).update(deltaTime);
        }
      });
    }
  }

  /**
   * Синхронизировать спрайт с трансформацией GameObject
   */
  protected syncWithGameObject() {
    if (!this.gameObject) return;
    
    // Применяем трансформацию GameObject + offset спрайта
    this.sprite.x = this.gameObject.x + this.config.offsetX!;
    this.sprite.y = this.gameObject.y + this.config.offsetY!;
    this.sprite.rotation = this.gameObject.rotation;
    // Комбинируем scale из конфига и GameObject
    this.sprite.scale.set(this.config.scale! * this.gameObject.scale);
    this.updateVisibility();
  }

  /**
   * Применить конфигурацию к спрайту
   */
  protected applyConfig() {
    // Не устанавливаем x, y здесь - они будут установлены в syncWithGameObject
    this.sprite.scale.set(this.config.scale!);
    this.sprite.rotation = this.config.rotation!;
    this.sprite.alpha = this.config.alpha!;
    this.sprite.tint = this.config.tint!;
    this.sprite.anchor.set(this.config.anchor!.x, this.config.anchor!.y);
    this.updateVisibility();
  }

  /**
   * Обновить видимость спрайта на основе режима привязки
   */
  protected updateVisibility() {
    const inherited = this.gameObject ? this.gameObject.active : true;
    let v = true;
    switch (this._binding) {
      case 'manual': v = this._localVisible; break;
      case 'and':    v = inherited && this._localVisible; break;
      case 'or':     v = inherited || this._localVisible; break;
      default:       v = inherited; // 'inherit'
    }
    this.sprite.visible = v;
  }


  /**
   * Установить контейнер для рендеринга
   */
  public setContainer(container: PIXI.Container): void {
    if (this.pixiContainer) {
      this.pixiContainer.removeChild(this.sprite);
    }
    this.pixiContainer = container;
    if (this.pixiContainer) {
      this.pixiContainer.addChild(this.sprite);
    }
  }


  public getContainer(): PIXI.Container | null {
    return this.pixiContainer;
  }

  /**
   * Установить offset спрайта относительно GameObject
   */
  setOffset(offsetX: number, offsetY: number) {
    this.config.offsetX = offsetX;
    this.config.offsetY = offsetY;
  }

  /**
   * Получить offset спрайта
   */
  getOffset(): { x: number; y: number } {
    return { x: this.config.offsetX!, y: this.config.offsetY! };
  }

  /**
   * Установить позицию спрайта (синхронизирует с GameObject)
   */
  setPosition(x: number, y: number) {
    if (this.gameObject) {
      this.gameObject.x = x;
      this.gameObject.y = y;
    }
  }

  /**
   * Получить позицию спрайта
   */
  getPosition(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  /**
   * Установить поворот (синхронизирует с GameObject)
   */
  setRotation(rotation: number) {
    if (this.gameObject) {
      this.gameObject.rotation = rotation;
    }
  }

  /**
   * Установить прозрачность
   */
  setAlpha(alpha: number) {
    this.sprite.alpha = alpha;
  }

  /**
   * Установить цвет
   */
  setTint(tint: number) {
    this.sprite.tint = tint;
  }

  /**
   * Установить видимость
   */
  setVisible(visible: boolean) {
    this._localVisible = visible;
    this.updateVisibility();
  }

  /**
   * Установить режим привязки видимости
   */
  setVisibilityBinding(mode: VisibilityBinding) {
    this._binding = mode;
    this.updateVisibility();
  }

  /**
   * Получить текущую локальную видимость
   */
  getLocalVisible(): boolean {
    return this._localVisible;
  }

  /**
   * Получить текущий режим привязки
   */
  getVisibilityBinding(): VisibilityBinding {
    return this._binding;
  }

  /**
   * Установить новую текстуру
   */
  setTexture(texture: PIXI.Texture) {
    this.sprite.texture = texture;
    // Обновляем конфигурацию
    this.config.texture = texture;
  }

  /**
   * Установить фильтры
   */
  setFilters(filters: PIXI.Filter[]) {
    this.sprite.filters = filters;
  }

  /**
   * Установить z-index спрайта
   */
  setZIndex(zIndex: number) {
    this.sprite.zIndex = zIndex;
  }

  /**
   * Получить z-index спрайта
   */
  getZIndex(): number {
    return this.sprite.zIndex;
  }

  /**
   * Получить границы спрайта
   */
  getBounds(): PIXI.Rectangle {
    return this.sprite.getBounds().rectangle;
  }

  /**
   * Проверить, содержит ли спрайт точку
   */
  containsPoint(point: { x: number; y: number }): boolean {
    return this.sprite.containsPoint(new PIXI.Point(point.x, point.y));
  }

  // ITweenable implementation
  get alpha(): number {
    return this.sprite.alpha;
  }

  set alpha(value: number) {
    this.sprite.alpha = value;
  }

  get scale(): number {
    return this.gameObject?.scale ?? 1;
  }

  set scale(value: number) {
    if (this.gameObject) {
      this.gameObject.scale = value;
    }
  }

  get rotation(): number {
    return this.gameObject?.rotation ?? 0;
  }

  set rotation(value: number) {
    if (this.gameObject) {
      this.gameObject.rotation = value;
    }
  }

  get x(): number {
    return this.gameObject?.x ?? 0;
  }

  set x(value: number) {
    if (this.gameObject) {
      this.gameObject.x = value;
    }
  }

  get y(): number {
    return this.gameObject?.y ?? 0;
  }

  set y(value: number) {
    if (this.gameObject) {
      this.gameObject.y = value;
    }
  }

  /**
   * Уничтожить спрайт
   */
  destroy() {
    if (this.sprite.parent) {
      this.sprite.parent.removeChild(this.sprite);
    }
    this.sprite.destroy();
  }
}
