// engine/components/PixiTextRenderer.ts
import { Component } from '../Component';
import * as PIXI from 'pixi.js';
import type { ITweenable } from './ITweenable';

export interface TextRendererConfig {
  text: string;
  style?: Partial<PIXI.TextStyle>;
  x?: number;
  y?: number;
  offsetX?: number;
  offsetY?: number;
  scale?: number;
  rotation?: number;
  alpha?: number;
  anchor?: { x: number; y: number };
  visible?: boolean;
}

/**
 * Компонент для рендеринга PixiJS текста
 * Независимый компонент без наследования
 */
export class PixiTextRenderer extends Component implements ITweenable {
  public textSprite: PIXI.Text;
  protected pixiContainer: PIXI.Container | null;
  protected config: TextRendererConfig;

  constructor(pixiContainer: PIXI.Container | null, config: TextRendererConfig) {
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
      anchor: { x: 0.5, y: 0.5 },
      visible: true,
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xffffff,
        align: 'center' as const
      },
      ...config
    };
    
    // Создаем PIXI.Text напрямую
    this.textSprite = new PIXI.Text({ text: this.config.text, style: this.config.style });
    
    // Применяем конфигурацию
    this.applyConfig();
  }

  /**
   * Применить конфигурацию к тексту
   */
  protected applyConfig() {
    const { anchor, scale, rotation, alpha, visible } = this.config;
    this.textSprite.anchor.set(anchor!.x, anchor!.y);
    this.textSprite.scale.set(scale!);
    this.textSprite.rotation = rotation!;
    this.textSprite.alpha = alpha!;
    this.textSprite.visible = visible!;
    this.textSprite.tint = 0xFFFFFF; // на всякий случай отключаем наследование tint
  }

  /**
   * Синхронизировать текст с трансформацией GameObject
   */
  protected syncWithGameObject() {
    if (!this.gameObject) return;
    
    // Применяем трансформацию GameObject + offset текста
    this.textSprite.x = this.gameObject.x + this.config.offsetX!;
    this.textSprite.y = this.gameObject.y + this.config.offsetY!;
    this.textSprite.rotation = this.gameObject.rotation;
    this.textSprite.scale.set(this.gameObject.scale);
    this.textSprite.visible = this.gameObject.active;
  }

  /**
   * Обновление компонента
   */
  update(_deltaTime: number) {
    this.syncWithGameObject();
  }

  /**
   * Добавление в контейнер
   */
  onAdded() {
    if (this.pixiContainer) {
      this.pixiContainer.addChild(this.textSprite);
    }
    this.syncWithGameObject();
  }

  /**
   * Удаление из контейнера
   */
  onRemoved() {
    if (this.textSprite.parent) {
      this.textSprite.parent.removeChild(this.textSprite);
    }
  }

  /**
   * Установить контейнер для рендеринга
   */
  setContainer(container: PIXI.Container): void {
    if (this.pixiContainer) {
      this.pixiContainer.removeChild(this.textSprite);
    }
    this.pixiContainer = container;
    if (this.pixiContainer) {
      this.pixiContainer.addChild(this.textSprite);
    }
  }

  /**
   * Установить offset текста относительно GameObject
   */
  setOffset(offsetX: number, offsetY: number) {
    this.config.offsetX = offsetX;
    this.config.offsetY = offsetY;
  }

  /**
   * Получить offset текста
   */
  getOffset(): { x: number; y: number } {
    return { x: this.config.offsetX!, y: this.config.offsetY! };
  }

  /**
   * Установить позицию текста (синхронизирует с GameObject)
   */
  setPosition(x: number, y: number) {
    if (this.gameObject) {
      this.gameObject.x = x;
      this.gameObject.y = y;
    }
  }

  /**
   * Получить позицию текста
   */
  getPosition(): { x: number; y: number } {
    return { x: this.textSprite.x, y: this.textSprite.y };
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
    this.textSprite.alpha = alpha;
  }

  /**
   * Установить видимость
   */
  setVisible(visible: boolean) {
    this.textSprite.visible = visible;
  }

  /**
   * Получить границы текста
   */
  getBounds(): PIXI.Rectangle {
    return this.textSprite.getBounds().rectangle;
  }

  /**
   * Проверить, содержит ли текст точку
   */
  containsPoint(point: { x: number; y: number }): boolean {
    return this.textSprite.containsPoint(new PIXI.Point(point.x, point.y));
  }

  /**
   * Получить текст (для обратной совместимости)
   */
  get text(): PIXI.Text {
    return this.textSprite;
  }

  /**
   * Установить текст
   */
  setText(text: string) {
    this.textSprite.text = text;
  }

  /**
   * Получить текущий текст
   */
  getText(): string {
    return this.textSprite.text;
  }

  /**
   * Установить стиль текста
   */
  setStyle(style: Partial<PIXI.TextStyle>) {
    Object.assign(this.textSprite.style, style);
  }

  /**
   * Установить размер шрифта
   */
  setFontSize(size: number) {
    this.textSprite.style.fontSize = size;
  }

  /**
   * Установить цвет текста
   */
  setFillColor(color: number) {
    this.textSprite.style.fill = color;
  }

  /**
   * Установить семейство шрифтов
   */
  setFontFamily(fontFamily: string) {
    this.textSprite.style.fontFamily = fontFamily;
  }

  /**
   * Установить выравнивание
   */
  setAlign(align: 'left' | 'center' | 'right') {
    this.textSprite.style.align = align;
  }

  /**
   * Детектор проблем с визуальной цепочкой
   * Вызывает в dev для отладки tint/фильтров
   */
  traceVisualChain() {
    const chain: any[] = [];
    let cur: any = this.textSprite;
    while (cur) {
      chain.push({
        type: cur.constructor?.name,
        name: cur.name,
        tint: cur.tint?.toString(16),
        alpha: cur.alpha,
        worldAlpha: cur.worldAlpha,
        blendMode: cur.blendMode,
        filters: cur.filters?.map((f: any) => f.constructor?.name),
      });
      cur = cur.parent;
    }
    console.table(chain);
    return chain;
  }

  // ITweenable implementation
  get alpha(): number {
    return this.textSprite.alpha;
  }

  set alpha(value: number) {
    this.textSprite.alpha = value;
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
   * Уничтожить текст
   */
  destroy() {
    if (this.textSprite.parent) {
      this.textSprite.parent.removeChild(this.textSprite);
    }
    this.textSprite.destroy();
  }
}
