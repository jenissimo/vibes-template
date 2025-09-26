import * as PIXI from 'pixi.js';
import { logger } from '@/engine/logging';
import { readSafeInsets, computeLayout, LayoutResult, createDebugOverlay } from './LayoutEngine';
import { TextureFactory } from '@game/graphics/TextureFactory';
import { ServiceRegistry, ServiceKeys } from '@/engine/registry';
import { CoordinateService } from '@/engine/coordinates';
import { RENDER_CONFIG, MOBILE_RENDER_CONFIG, HIGH_END_MOBILE_RENDER_CONFIG } from './RenderConfig';
import { eventBus } from '@/engine/events/EventBus';
import { detectDevicePerformance, getDevicePerformanceLabel } from '@/utils/deviceDetection';

export interface PixiConfig {
  width?: number;
  height?: number;
  backgroundColor?: number;
  antialias?: boolean;
  resolution?: number;
  autoDensity?: boolean;
  enableFPSLimit?: boolean;
  targetFPS?: number;
}

export class PixiRenderer {
  private app!: PIXI.Application;
  private canvas!: HTMLCanvasElement;
  private currentLayout: LayoutResult | null = null;
  private debugOverlay: HTMLElement | null = null;
  private debugOverlayEnabled = false; // флаг для контроля debug overlay

  // сохраняем ссылку для корректной отписки
  private onWinResize = () => this.handleResize();

  constructor(private config: PixiConfig = {}) {}


  public async initialize(): Promise<void> {
    logger.info('🎨 Init Pixi v8...', { source: 'game' });

    this.canvas = document.getElementById('pixi-canvas') as HTMLCanvasElement;
    if (!this.canvas) throw new Error('Canvas with id="pixi-canvas" not found');

    // Detect device performance and select appropriate config
    const deviceCapabilities = detectDevicePerformance();
    const renderConfig = deviceCapabilities.performance === 'desktop' 
      ? RENDER_CONFIG 
      : deviceCapabilities.performance === 'high-end-mobile' 
        ? HIGH_END_MOBILE_RENDER_CONFIG 
        : MOBILE_RENDER_CONFIG;

    logger.info(`🎯 Device detected: ${getDevicePerformanceLabel(deviceCapabilities)}`, { 
      source: 'game',
      capabilities: deviceCapabilities
    });

    // v8: создаём и потом инициализируем
    this.app = new PIXI.Application();
    await this.app.init({
      canvas: this.canvas,                      // v8: предпочтительно canvas
      width: this.config.width ?? window.innerWidth,
      height: this.config.height ?? window.innerHeight,
      background: this.config.backgroundColor ?? 0x0a0a0a,
      antialias: this.config.antialias ?? true,
      resolution: Math.min(window.devicePixelRatio || 1, renderConfig.maxResolution),
      autoDensity: this.config.autoDensity ?? true,
      resizeTo: window,                         // v8 ResizePlugin берёт управление ресайзом
    });                                         // ← это главное отличие v8. :contentReference[oaicite:6]{index=6}

    // Если используешь zIndex — включи сортировку
    this.app.stage.sortableChildren = true;     // иначе зону можно не увидеть под UI. :contentReference[oaicite:7]{index=7}

    // FPS cap (TickerPlugin включён по умолчанию в v8)
    if (renderConfig.enableFPSLimit && renderConfig.targetFPS) {
      this.app.ticker.maxFPS = renderConfig.targetFPS;      // поддерживается в v8. :contentReference[oaicite:8]{index=8}
    }

    // регистрируем сервисы ПОСЛЕ init
    ServiceRegistry.register(ServiceKeys.PixiApp, this.app);
    ServiceRegistry.register(ServiceKeys.PixiRenderer, this);

    // инициализируем фабрику текстур
    TextureFactory.getInstance().initialize();

    // подписки
    eventBus.on('window-resize', this.onWinResize);

    // первичный layout (используем размеры app.screen, они уже синхронизированы с canvas)
    this.handleResize();

    logger.info('✅ Pixi v8 ready', { source: 'game' });
  }

  private handleResize(): void {
    if (!this.app) return;

    const screenW = this.app.screen.width;
    const screenH = this.app.screen.height;
    const insets = readSafeInsets();

    this.currentLayout = computeLayout(screenW, screenH, insets);
    CoordinateService.getInstance().setLayout(this.currentLayout);

    // Ничего не трогаем руками: ResizePlugin уже сделал resize/canvas css.
    this.notifyUIResize(this.currentLayout);
    this.updateSpaceBackground();
    // debug overlay обновляем только если он включен
    if (this.debugOverlayEnabled) {
      this.updateDebugOverlay();
    }
  }

  private notifyUIResize(layout: LayoutResult): void {
    eventBus.emit('pixi-resize', {
      layout,
      gameWidth: layout.game.w, gameHeight: layout.game.h,
      scale: layout.scaleGame, scaleUI: layout.scaleUI, safe: layout.safe
    });
  }

  private updateSpaceBackground(): void {
    const renderSystem = ServiceRegistry.has(ServiceKeys.RenderSystem)
      ? ServiceRegistry.get<any>(ServiceKeys.RenderSystem)
      : null;
    renderSystem?.updateSpaceBackgroundSize?.();
  }

  private updateDebugOverlay(): void {
    if (!this.currentLayout) return;
    this.debugOverlay?.remove();
    this.debugOverlay = createDebugOverlay(this.currentLayout);
    document.body.appendChild(this.debugOverlay);
  }

  // ===== Public API =====
  public getApp(): PIXI.Application {
    return this.app;
  }

  public getStage(): PIXI.Container {
    return this.app.stage;
  }

  public getRenderer(): PIXI.Renderer {
    return this.app.renderer;
  }

  public getScreenSize(): { width: number; height: number } {
    return {
      width: this.app.screen.width,
      height: this.app.screen.height,
    };
  }

  public getCurrentLayout(): LayoutResult | null {
    return this.currentLayout;
  }

  public toggleDebugOverlay(): void {
    this.debugOverlayEnabled = !this.debugOverlayEnabled;
    
    if (this.debugOverlayEnabled) {
      if (this.currentLayout) {
        this.debugOverlay = createDebugOverlay(this.currentLayout);
        document.body.appendChild(this.debugOverlay);
      }
    } else {
      if (this.debugOverlay) {
        this.debugOverlay.remove();
        this.debugOverlay = null;
      }
    }
  }

  public setFPSLimit(fps: number): void {
    if (!this.app) {
      logger.warn('❌ PixiJS приложение не инициализировано', { source: 'game' });
      return;
    }

    if (fps > 0) {
      this.app.ticker.maxFPS = fps;
      logger.info(`🎯 FPS cap установлен: ${fps} FPS`, { source: 'game' });
    } else {
      this.app.ticker.maxFPS = 0;
      logger.info('🚀 FPS cap отключен', { source: 'game' });
    }
  }

  public getFPSLimit(): number {
    return this.app?.ticker.maxFPS || 0;
  }

  public getCurrentFPS(): number {
    return this.app?.ticker.FPS || 0;
  }

  public destroy(): void {
    eventBus.off('window-resize', this.onWinResize);  // та же ссылка!
    this.debugOverlay?.remove();
    this.app?.destroy(false);
    ServiceRegistry.unregister(ServiceKeys.PixiApp);
    ServiceRegistry.unregister(ServiceKeys.PixiRenderer);
    logger.info('🧹 Pixi destroyed', { source: 'game' });
  }
}
