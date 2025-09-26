import { Component } from '@/engine/Component';
import { PixiSpriteRenderer } from '@/engine/components/PixiSpriteRenderer';
import { ServiceRegistry, ServiceKeys } from '@/engine/registry';
import { logger } from '@/engine/logging';
import * as PIXI from 'pixi.js';
import { EffectSystem, GameObject, IconTextRenderer, TweenComponent } from '@/engine';
import { GameEventBus } from '../events/GameEventBus';

export class ClickComponent extends Component {
  private spriteComponent: PixiSpriteRenderer | null = null;
  private currencyAmount: number;
  private currencyTexture: PIXI.Texture | null = null;
  private effectSystem: EffectSystem;

  constructor(currencyAmount: number, effectSystem: EffectSystem) {
    super();
    this.currencyAmount = currencyAmount;
    this.effectSystem = effectSystem;
  }

  onAdded(): void {
    this.spriteComponent = this.gameObject.get(PixiSpriteRenderer) ?? null;
    
    if (!this.spriteComponent) {
      logger.warn('ClickComponent: PixiSpriteRenderer or SVGSpriteComponent not found on GameObject', { 
        source: 'game',
        gameObjectId: this.gameObject?.id,
        components: this.gameObject.getComponents().map(c => c.constructor.name)
      });
      return;
    }

    this.loadCurrencyTexture();
    this.setupInteraction();
  }

  onRemoved(): void {
    this.cleanupInteraction();
  }

  private async loadCurrencyTexture(): Promise<void> {
    const assetManager = ServiceRegistry.get(ServiceKeys.AssetManager) as any;
    this.currencyTexture = await assetManager?.loader?.loadTexture('item-credit');
  }
  
  private setupInteraction(): void {
    if (!this.spriteComponent) return;

    // Enable interaction on the sprite
    this.spriteComponent.sprite.interactive = true;
    this.spriteComponent.sprite.cursor = 'pointer';

    // Subscribe to click events
    this.spriteComponent.sprite.on('pointerdown', this.handleClick.bind(this));
  }

  private cleanupInteraction(): void {
    if (!this.spriteComponent) return;

    // Remove event listeners
    this.spriteComponent.sprite.off('pointerdown', this.handleClick.bind(this));
    
    // Disable interaction
    this.spriteComponent.sprite.interactive = false;
    this.spriteComponent.sprite.cursor = 'default';
  }

  private handleClick(_event: PIXI.FederatedPointerEvent): void {
    if (!this.gameObject.scene) return;

    // Emit event to add credits
    GameEventBus.getInstance().emit('add-credits', { amount: this.currencyAmount });

    // Add floating text
    this.gameObject.scene.add(
        new GameObject()
          .setName('FloatingText')
          .setPosition(this.gameObject.x, this.gameObject.y)
          .add(new IconTextRenderer(
              this.spriteComponent?.getContainer() ?? null, // Ensure null, not undefined
              {
                iconTexture: this.currencyTexture ?? undefined,
                text: `+${this.currencyAmount}`,
                iconSize: 32,
                textStyle: { fontFamily: 'Orbitron', fontSize: 24, fill: 0x4ecdc4, align: 'left', fontWeight: 'bold' },
                layout: 'horizontal'
              }
            ))
            .add(
                new TweenComponent()
                    .to({ y: `-=${500}`, duration: 2, ease: 'power2.out' })
                    .use('IconTextRenderer')
                    .fromTo({ alpha: 0 }, { alpha: 1, duration: 0.15 }, 0)
                    .fromTo({ alpha: 1 }, { alpha: 0, duration: 1, ease: 'power1.out' }, 1)
            )
    );

    // Trigger explosion effect
    this.effectSystem.triggerExplosion(this.gameObject.x, this.gameObject.y, 2);
  }
}

