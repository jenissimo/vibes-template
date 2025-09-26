// engine/components/IconTextRenderer.ts
import { Component } from '../Component';
import * as PIXI from 'pixi.js';
import type { ITweenable } from './ITweenable';

export interface IconTextConfig {
  iconTexture?: PIXI.Texture;
  text?: string;
  iconSize?: number;
  textStyle?: Partial<PIXI.TextStyle>;
  spacing?: number;
  layout?: 'horizontal' | 'vertical';
  anchor?: { x: number; y: number };
  alpha?: number;
  visible?: boolean;
}

/**
 * Компонент для рендеринга иконки с текстом
 * Объединяет PixiSpriteRenderer и PixiTextRenderer в одном компоненте
 */
export class IconTextRenderer extends Component implements ITweenable {
  public container: PIXI.Container;
  public iconSprite: PIXI.Sprite;
  public textSprite: PIXI.Text;
  protected pixiContainer: PIXI.Container | null;
  protected config: IconTextConfig;

  constructor(pixiContainer: PIXI.Container | null, config: IconTextConfig) {
    super();
    this.pixiContainer = pixiContainer;
    this.config = {
      iconSize: 32,
      text: '',
      spacing: 0,
      layout: 'horizontal',
      anchor: { x: 0.5, y: 0.5 },
      alpha: 1,
      visible: true,
      ...config
    };

    // Создаем контейнер для иконки и текста
    this.container = new PIXI.Container();
    
    // Создаем спрайт иконки
    this.iconSprite = new PIXI.Sprite(this.config.iconTexture || PIXI.Texture.EMPTY);
    // Anchor будет установлен в layoutElements()
    
    // Создаем текст
    this.textSprite = new PIXI.Text({ 
      text: this.config.text || '', 
      style: {
        fontFamily: 'Orbitron',
        fontSize: 24,
        fill: 0x4ecdc4,
        align: 'left',
        fontWeight: 'bold',
        ...this.config.textStyle
      }
    });
    // Anchor будет установлен в layoutElements()
    
    // Добавляем в контейнер
    this.container.addChild(this.iconSprite);
    this.container.addChild(this.textSprite);
    
    this.applyConfig();
  }

  onAdded() {
    if (this.pixiContainer) {
      this.pixiContainer.addChild(this.container);
    }
    this.syncWithGameObject();
  }

  onRemoved() {
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }
  }

  update(_deltaTime: number) {
    this.syncWithGameObject();
  }

  /**
   * Синхронизировать с трансформацией GameObject
   */
  protected syncWithGameObject() {
    if (!this.gameObject) return;
    
    this.container.x = this.gameObject.x;
    this.container.y = this.gameObject.y;
    this.container.rotation = this.gameObject.rotation;
    this.container.scale.set(this.gameObject.scale);
    this.container.alpha = this.gameObject.active ? this.config.alpha! : 0;
    this.container.visible = this.gameObject.active && this.config.visible!;
  }

  /**
   * Применить конфигурацию
   */
  protected applyConfig() {
    // Устанавливаем размер иконки
    if (this.config.iconTexture) {
      this.iconSprite.texture = this.config.iconTexture;
    }
    
    const iconSize = this.config.iconSize!;
    this.iconSprite.width = iconSize;
    this.iconSprite.height = iconSize;
    
    // Устанавливаем текст
    this.textSprite.text = this.config.text || '';
    if (this.config.textStyle) {
      this.textSprite.style = { ...this.textSprite.style, ...this.config.textStyle };
    }
    
    // Позиционируем элементы в зависимости от layout
    this.layoutElements();
    
    // Устанавливаем anchor для всего контейнера
    this.container.pivot.set(
      this.container.width * this.config.anchor!.x,
      this.container.height * this.config.anchor!.y
    );
  }

  /**
   * Разместить элементы в зависимости от layout
   */
  private layoutElements() {
    const spacing = this.config.spacing!;
    const iconSize = this.config.iconSize!;
    
    if (this.config.layout === 'horizontal') {
      // Горизонтальное размещение: [иконка] [текст]
      // Иконка слева от центра, текст справа от иконки
      this.iconSprite.x = -iconSize / 2 - spacing / 2;
      this.textSprite.x = iconSize / 2 + spacing / 2;
      this.iconSprite.y = 0;
      this.textSprite.y = 0;
      
      // Устанавливаем правильные anchor для горизонтального layout
      this.iconSprite.anchor.set(0.5, 0.5); // Центр иконки
      this.textSprite.anchor.set(0, 0.5);   // Левая сторона текста по X, центр по Y
      
      // Отладочная информация
      console.log(`IconTextRenderer layout: iconSize=${iconSize}, spacing=${spacing}, iconX=${this.iconSprite.x}, textX=${this.textSprite.x}, textAnchor=${this.textSprite.anchor.x}`);
    } else {
      // Вертикальное размещение: [иконка] сверху, [текст] снизу
      this.iconSprite.x = 0;
      this.textSprite.x = 0;
      this.iconSprite.y = -iconSize / 2 - spacing / 2;
      this.textSprite.y = iconSize / 2 + spacing / 2;
      
      // Устанавливаем правильные anchor для вертикального layout
      this.iconSprite.anchor.set(0.5, 0.5); // Центр иконки
      this.textSprite.anchor.set(0.5, 0);   // Центр текста по X, верх по Y
    }
  }

  /**
   * Установить текстуру иконки
   */
  setIconTexture(texture: PIXI.Texture) {
    this.config.iconTexture = texture;
    this.iconSprite.texture = texture;
    this.layoutElements();
  }

  /**
   * Установить текст
   */
  setText(text: string) {
    this.config.text = text;
    this.textSprite.text = text;
    this.layoutElements();
  }

  /**
   * Установить размер иконки
   */
  setIconSize(size: number) {
    this.config.iconSize = size;
    this.iconSprite.width = size;
    this.iconSprite.height = size;
    this.layoutElements();
  }

  /**
   * Установить стиль текста
   */
  setTextStyle(style: Partial<PIXI.TextStyle>) {
    this.config.textStyle = { ...this.config.textStyle, ...style };
    this.textSprite.style = { ...this.textSprite.style, ...style };
    // Пересчитываем позиционирование после изменения стиля
    this.layoutElements();
  }

  /**
   * Установить расстояние между иконкой и текстом
   */
  setSpacing(spacing: number) {
    this.config.spacing = spacing;
    this.layoutElements();
  }

  /**
   * Установить layout (горизонтальный или вертикальный)
   */
  setLayout(layout: 'horizontal' | 'vertical') {
    this.config.layout = layout;
    this.layoutElements();
  }

  /**
   * Установить прозрачность
   */
  setAlpha(alpha: number) {
    this.config.alpha = alpha;
    this.container.alpha = alpha;
  }

  /**
   * Получить прозрачность
   */
  getAlpha(): number {
    return this.container.alpha;
  }

  // ITweenable implementation
  get alpha(): number {
    return this.container.alpha;
  }

  set alpha(value: number) {
    this.config.alpha = value;
    this.container.alpha = value;
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
   * Установить видимость
   */
  setVisible(visible: boolean) {
    this.config.visible = visible;
    this.container.visible = visible;
  }

  /**
   * Получить границы всего компонента
   */
  getBounds(): PIXI.Rectangle {
    const bounds = this.container.getBounds();
    return new PIXI.Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
  }

  /**
   * Уничтожить компонент
   */
  destroy() {
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }
    this.container.destroy({ children: true });
  }
}
