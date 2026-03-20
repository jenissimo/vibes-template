// Core engine
import { Scene, GameObject, Game } from '@/engine';
import { logger } from '@/engine/logging';
import { ServiceRegistry } from '@/engine/registry';

// PIXI
import * as PIXI from 'pixi.js';

// Render & Layout
import { computeLayout, readSafeInsets } from '@/engine/render/LayoutEngine';
import { RENDER_CONFIG } from '@/engine/render/RenderConfig';
import { LayerManager } from '@/engine/render/LayerManager';
import { PixiSpriteRenderer } from '@/engine/components';

// Events & Coordinates
import { eventBus } from '@/engine/events/EventBus';
import { CoordinateService } from '@/engine/coordinates';

// Audio & Effects
import { AudioManager } from '@/engine/audio/AudioManager';
import { EffectSystem } from '@/engine/effects/EffectSystem';


// Game systems
import { SpaceBackgroundSystem } from '../systems/SpaceBackgroundSystem';

// Game components
import { SVGSpriteComponent } from '../components';
import { RotationComponent } from '../components/RotationComponent';
import { ClickComponent } from '../components/ClickComponent';

// Graphics
import { GameAssetService } from '@/game/assets/GameAssetService';
import { TextureFactory } from '@/game/graphics/TextureFactory';
import { NeonGlowScanlineFilter } from '../graphics/filters/NeonGlowScanlineFilter';

// Assets
import { SVG_PATHS } from '@/assets/svg';

type Deps = { stage: PIXI.Container; game: Game; audio: AudioManager };

export class GameScene extends Scene {
  private bgC?: PIXI.Container;
  private gameC?: PIXI.Container;
  private fx?: EffectSystem;
  private layerManager?: LayerManager;
  // SpaceBackgroundSystem is managed via Scene.addSystem()
  
  // Services
  private gameAssetService?: GameAssetService;
  private textureFactory?: TextureFactory;
  
  private unsubscribeFromEvents: (() => void)[] = [];

  // важно: не .bind() на (un)subscribe
  private readonly onResize = () => this.relayout();
  /** ————— Lifecycle ————— */

  async onEnter() {
    logger.info('🎬 GameScene entered');
    const { stage, game, audio } = this.requireManagers();

    // менеджеры/контейнеры
    this.initContainers(stage)
        .initLayerManager()
        .initEffects(game)
        .initSpaceBackgroundSystem()
        .hookResize()
        .relayout();

    // play music
    audio.playMusic('main_theme');
    this.initDemoObjects();
  }

  onExit() {
    logger.info('🎬 GameScene exited');
    this.unsubscribeFromEvents.forEach(unsub => unsub());
    this.unsubscribeFromEvents = [];
    eventBus.off('window-resize', this.onResize);

    this.destroyAllSystems();
    
    // контейнеры отпустим; Pixi сцена их зачистит по своему жизненному циклу
    this.bgC = undefined;
    this.gameC = undefined;
  }

  // Systems are updated automatically by Scene.update() via addSystem()

  /** ————— Layout ————— */

  private relayout() {
    if (!this.bgC || !this.gameC) return;

    const insets = readSafeInsets();
    const layout = computeLayout(window.innerWidth, window.innerHeight, insets);

    // sync сервис координат
    CoordinateService.getInstance().setLayout(layout);

    // background
    this.bgC.x = layout.bg.x; this.bgC.y = layout.bg.y;
    this.bgC.hitArea = new PIXI.Rectangle(0, 0, layout.bg.w, layout.bg.h);
    this.getSystem(SpaceBackgroundSystem)?.resize(layout.bg.w, layout.bg.h);

    // game
    this.gameC.x = layout.game.x; this.gameC.y = layout.game.y;
    this.gameC.scale.set(layout.scaleGame);
    this.gameC.hitArea = new PIXI.Rectangle(0, 0, RENDER_CONFIG.referenceResolution.w, RENDER_CONFIG.referenceResolution.h);
  }

  /** ————— Init (fluent) ————— */

  private initContainers(stage: PIXI.Container) {
    // один раз создаём, кладём на stage
    this.bgC = new PIXI.Container();
    this.gameC = new PIXI.Container();
    stage.addChild(this.bgC, this.gameC);
    return this;
  }

  private initLayerManager() {
    if (!this.gameC) return this;
    this.layerManager = new LayerManager(this.gameC);
    logger.info('✅ LayerManager инициализирован');
    return this;
  }

  private initEffects(game: Game) {
    this.fx = game.getManager('effects') as EffectSystem | undefined;
    if (!this.fx || !this.gameC || !this.layerManager) {
      logger.warn('⚠️ EffectSystem не инициализирован (нет менеджера, контейнера или LayerManager)');
      return this;
    }
    this.fx.setContainer(this.gameC, this.layerManager);
    this.fx.start();
    logger.info('✅ EffectSystem инициализирован с LayerManager');
    return this;
  }

  private initSpaceBackgroundSystem() {
    if (!this.bgC) return this;

    this.addSystem(new SpaceBackgroundSystem(this, this.bgC));

    logger.info('✅ SpaceBackgroundSystem инициализирована');
    return this;
  }


  private async initDemoObjects() {
    this.gameAssetService = ServiceRegistry.get<GameAssetService>('gameAssetService');
    this.textureFactory = ServiceRegistry.get<TextureFactory>('textureFactory');

    if (!this.gameAssetService || !this.textureFactory) {
      logger.warn('⚠️ GameAssetService или TextureFactory не найдены в ServiceRegistry');
      return this;
    }

    if (!this.gameC) {
      logger.warn('⚠️ GameContainer не инициализирован для демо объектов');
      return this;
    }

    if (!this.layerManager) {
      logger.warn('⚠️ LayerManager не инициализирован для демо объектов');
      return this;
    }

    if (!this.fx) {
      logger.warn('⚠️ EffectSystem не инициализирован для демо объектов');
      return this;
    }

      // Padding для glow
     const padding = 128;
     const vibesObject = new GameObject()
       .setName('Vibes')
       .setPosition(500, 1000)
       .setScale(4)
       .add(new PixiSpriteRenderer(this.gameC, {
         texture: this.gameAssetService.assetLoader.getAsset<PIXI.Texture>('sprite-vibes') ?? undefined,
         anchor: { x: 0.5, y: 0.5 },
         tint: 0xFFFFFF,
         filters: [new NeonGlowScanlineFilter(
           {
             glowColor: 0xFFFFFF,
             innerStrength: 0.1,
             outerStrength: 2.5,
             radius: 8,
             samples: 8,
             alphaThreshold: 0.01,
             scanIntensity: 0.5,
             scanSpeed: 1.6,
           }
         )],
       }))
       .add(new ClickComponent(100, this.fx))
       .add(new RotationComponent(0.5));

     // Устанавливаем filterArea после создания рендерера
     const vibesRenderer = vibesObject.get(PixiSpriteRenderer);
     if (vibesRenderer) {
       vibesRenderer.sprite.filterArea = new PIXI.Rectangle(-padding, -padding, padding * 2, padding * 2);
     }

     this.add(vibesObject);

    this.add(
      new GameObject()
        .setName('SVG Sprite')
        .setPosition(300, 500)
        .add(new SVGSpriteComponent(this.gameC, {
          svgPath: SVG_PATHS.sprite,
          size: 256,
        }))
        .add(new ClickComponent(100, this.fx))
        .add(new RotationComponent(-0.5))
    );

    return this;
  }


  private hookResize() {
    eventBus.on('window-resize', this.onResize);
    return this;
  }


  /** ————— Utilities ————— */

  private requireManagers(): Deps {
    if (!this.managers) {
      const err = new Error('Managers not provided');
      logger.error('❌ Менеджеры не переданы в сцену!', err);
      throw err; // короче, чем везде if (!this.managers) return;
    }
    const { stage, game, audio } = this.managers as Deps;
    return { stage, game, audio };
  }
}