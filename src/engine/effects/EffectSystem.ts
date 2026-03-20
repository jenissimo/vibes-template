import { logger } from '@/engine/logging';
import { ParticleSystem, ParticleEmitterConfig } from './ParticleSystem';
import { AudioManager } from '@/engine/audio/AudioManager';
import * as PIXI from 'pixi.js';
import { effectDefinitions } from './effect-definitions';
import { ServiceRegistry, ServiceKeys } from '@/engine/registry';
import { LayerManager, LAYER_DEPTHS } from '@/engine/render/LayerManager';

export class EffectSystem {
  requiredComponents = [];
  private particleSystem!: ParticleSystem;
  private screenShakeIntensity: number = 0;
  private screenShakeDuration: number = 0;
  private camera: PIXI.Container;
  private particleContainer!: PIXI.Container; // Храним контейнер частиц отдельно
  private baseCameraPosition: { x: number; y: number } = { x: 0, y: 0 };
  private currentShakeOffset: { x: number; y: number } = { x: 0, y: 0 };
  private lastShakeTime: number = 0;
  private minShakeInterval: number = 0.05; // Минимальный интервал между трясками (50ms)
  private audioManager: AudioManager | null = null;
  private layerManager: LayerManager | null = null;

  constructor(stage: PIXI.Container, renderer?: PIXI.Renderer, audioManager?: AudioManager, layerManager?: LayerManager) {
    this.camera = stage;
    this.audioManager = audioManager || null;
    this.layerManager = layerManager || null;
    this.initializeParticleSystem(stage, renderer);
  }

  /**
   * Устанавливает новый контейнер для эффектов
   */
  setContainer(newContainer: PIXI.Container, layerManager?: LayerManager): void {
    this.destroyParticleSystem(true);
    this.camera = newContainer;
    this.layerManager = layerManager || null;
    this.baseCameraPosition = { x: newContainer.x, y: newContainer.y };
    this.initializeParticleSystem(newContainer);
    logger.info('EffectSystem container updated', { source: 'effects' });
  }

  getContainer(): PIXI.Container {
    return this.particleContainer;
  }

  /**
   * Устанавливает AudioManager для воспроизведения звуков
   */
  setAudioManager(audioManager: AudioManager): void {
    this.audioManager = audioManager;
    logger.info('🔊 AudioManager установлен в EffectSystem', { source: 'effects' });
  }

  update(deltaTime: number): void {
    // Важно: обновление шейка до обновления камеры, если есть логика слежения
    this.updateScreenShake(deltaTime);
    this.particleSystem.update(deltaTime);
  }

  // Основной метод для запуска комплексных эффектов
  public triggerEffect(name: keyof typeof effectDefinitions, x: number, y: number, customColor?: number): void {
    const definition = effectDefinitions[name];
    if (!definition) {
      logger.warn('Effect definition "${name}" not found.', { source: 'game' });
      return;
    }

    // Запускаем частицы
    if (definition.particles) {
      for (const p of definition.particles) {
        // Позицию берём из аргументов, остальное из конфига
        const config = { ...p.config, x, y };
        // Если передан кастомный цвет, используем его для startColor и endColor
        if (customColor !== undefined) {
          config.startColor = customColor;
          if ('endColor' in config) {
            config.endColor = customColor;
          }
        }
        this.particleSystem.emit(config as ParticleEmitterConfig);
      }
    }
    
    // Проигрываем звук
    if (definition.sound && this.audioManager) {
      // Здесь можно добавить более сложную логику (loop, volume и т.д.)
      this.audioManager.playSFX(definition.sound.name as any);
    } else if (definition.sound && !this.audioManager) {
      logger.warn('🔇 AudioManager не установлен, звук не воспроизведен', { 
        sound: definition.sound.name, 
        source: 'effects' 
      });
    }
    
    // Запускаем тряску экрана
    if ('screenShake' in definition && definition.screenShake) {
      this.triggerScreenShake(definition.screenShake.intensity, definition.screenShake.duration);
    }
  }

  // --- Прежние методы теперь просто вызывают triggerEffect с нужным конфигом ---
  
  triggerExplosion(x: number, y: number, size: number = 1): void {
      if (size < 1.5) {
          this.triggerEffect('smallExplosion', x, y);
      } else {
          this.triggerEffect('largeExplosion', x, y);
      }
  }

  triggerDebris(x: number, y: number, _size: number = 1): void {
    this.triggerEffect('debris', x, y);
  }

  triggerSparks(x: number, y: number, _intensity: number = 1): void {
    this.triggerEffect('sparks', x, y);
  }

  triggerDust(x: number, y: number, _amount: number = 1): void {
    this.triggerEffect('dust', x, y);
  }

  triggerMiningEffect(x: number, y: number, _intensity: number = 1): void {
    //logger.info('[EffectSystem] triggerMiningEffect called at (${x}, ${y}) with intensity ${intensity}', { source: 'game' });
    this.triggerEffect('mining', x, y);
  }

  triggerResourceGlow(x: number, y: number, color: number, _size: number = 1): void {
    this.triggerEffect('glow', x, y, color);
  }

  triggerCollectionEffect(x: number, y: number, resourceType: string, amount: number): void {
    // Определяем цвет и эффект в зависимости от типа ресурса
    let effectName: keyof typeof effectDefinitions = 'collection';
    let color: number | undefined;

    switch (resourceType) {
      case 'coins':
        effectName = 'coinCollection';
        color = 0xffd700; // Gold
        break;
      case 'neon_iron':
        effectName = 'oreCollection';
        color = 0x10b981; // Green
        break;
      case 'energy':
        effectName = 'energyCollection';
        color = 0x3b82f6; // Blue
        break;
      case 'cobalt':
        effectName = 'rareCollection';
        color = 0x8b5cf6; // Purple
        break;
      case 'titanium':
        effectName = 'rareCollection';
        color = 0x06b6d4; // Cyan
        break;
      default:
        effectName = 'collection';
        color = 0xffffff; // White
    }

    // Запускаем эффект сбора
    this.triggerEffect(effectName, x, y, color);

    // Если количество большое, добавляем дополнительный эффект
    if (amount > 5) {
      this.triggerEffect('bigCollection', x, y, color);
    }
  }

  // Screen effects
  triggerScreenShake(intensity: number, duration: number): void {
    const currentTime = performance.now() / 1000; // Время в секундах
    
    // Проверяем кулдаун для слабых трясок (майнинг, искры)
    if (intensity < 1.0 && (currentTime - this.lastShakeTime) < this.minShakeInterval) {
      return; // Пропускаем слабую тряску, если прошло мало времени
    }
    
    this.screenShakeIntensity = Math.max(this.screenShakeIntensity, intensity);
    this.screenShakeDuration = Math.max(this.screenShakeDuration, duration);
    this.lastShakeTime = currentTime;
  }

  private updateScreenShake(deltaTime: number): void {
    if (this.screenShakeDuration > 0) {
      // Убираем предыдущее смещение
      this.camera.x -= this.currentShakeOffset.x;
      this.camera.y -= this.currentShakeOffset.y;
      
      // Вычисляем новое смещение
      this.currentShakeOffset.x = (Math.random() - 0.5) * this.screenShakeIntensity * 10;
      this.currentShakeOffset.y = (Math.random() - 0.5) * this.screenShakeIntensity * 10;
      
      // Применяем новое смещение
      this.camera.x += this.currentShakeOffset.x;
      this.camera.y += this.currentShakeOffset.y;
      
      this.screenShakeDuration -= deltaTime;
      this.screenShakeIntensity *= 0.9; // Decay
      
      if (this.screenShakeDuration <= 0) {
        // Убираем последнее смещение
        this.camera.x -= this.currentShakeOffset.x;
        this.camera.y -= this.currentShakeOffset.y;
        this.currentShakeOffset = { x: 0, y: 0 };
        this.screenShakeIntensity = 0;
      }
    }
  }

  async playUISound(soundType: string): Promise<void> {
    if (!this.audioManager) {
      logger.warn('🔇 AudioManager не установлен, UI звук не воспроизведен', { 
        soundType, 
        source: 'effects' 
      });
      return;
    }

    switch (soundType) {
      case 'click':
        await this.audioManager.playSFX('ui_click');
        break;
      case 'hover':
        await this.audioManager.playSFX('ui_hover');
        break;
      case 'purchase':
        await this.audioManager.playSFX('ui_purchase');
        break;
      case 'error':
        await this.audioManager.playSFX('ui_error');
        break;
      case 'notification':
        await this.audioManager.playSFX('ui_notification');
        break;
    }
  }

  // Camera effects
  triggerZoom(targetScale: number, _duration: number = 0.5): void {
    // This would be implemented with a tween system
    // For now, just set the scale directly
    this.camera.scale.set(targetScale);
  }

  resetCamera(): void {
    this.camera.x = this.baseCameraPosition.x;
    this.camera.y = this.baseCameraPosition.y;
    this.camera.scale.set(1);
  }

  // Utility methods
  start(): void {
    logger.info('[EffectSystem] start() called', { source: 'game' });
    this.particleSystem.start();
  }

  stop(): void {
    this.particleSystem.stop();
    this.resetCamera();
  }

  clear(): void {
    this.particleSystem.clear();
  }

  destroy(): void {
    this.stop();
    this.destroyParticleSystem(true);
    this.audioManager = null;
    this.layerManager = null;
    logger.info('🧹 EffectSystem destroyed', { source: 'effects' });
  }

  getParticleCount(): number {
    return this.particleSystem.getParticleCount();
  }

  /**
   * Перезагрузка шейдеров для HMR
   * Проходит по всем спрайтам в контейнере и пересоздает фильтры
   */
  reloadShaders(): void {
    logger.info('♻️ Reloading shaders for HMR...', { source: 'effects' });

    let reloadedCount = 0;

    // Recursively traverse containers, reloading filters on any Container (not just Sprites)
    const processContainer = (container: PIXI.Container) => {
      // Check filters on the container itself
      if (container.filters) {
        const newFilters: PIXI.Filter[] = [];

        for (const filter of container.filters) {
          try {
            if ('getReloadParams' in filter && typeof (filter as any).getReloadParams === 'function') {
              const params = (filter as any).getReloadParams();
              const NewFilter = (filter.constructor as any);
              newFilters.push(new NewFilter(params));
              reloadedCount++;
            } else {
              newFilters.push(filter);
            }
          } catch (error) {
            logger.warn('⚠️ Failed to reload filter', {
              filterType: filter.constructor.name,
              error: error instanceof Error ? error.message : String(error),
              source: 'effects'
            });
            newFilters.push(filter);
          }
        }

        container.filters = newFilters;
      }

      // Recurse into children
      for (const child of container.children) {
        if (child instanceof PIXI.Container) {
          processContainer(child);
        }
      }
    };

    // Traverse from the stage root (via PixiApp) to cover all containers
    const root = this.getStageRoot();
    processContainer(root);

    logger.info(`✅ Reloaded ${reloadedCount} shaders`, { source: 'effects' });
  }

  private getStageRoot(): PIXI.Container {
    if (ServiceRegistry.has(ServiceKeys.PixiApp)) {
      return ServiceRegistry.get<PIXI.Application>(ServiceKeys.PixiApp).stage;
    }
    return this.camera;
  }

  private resolveRenderer(explicit?: PIXI.Renderer): PIXI.Renderer {
    if (explicit) {
      return explicit;
    }

    if (ServiceRegistry.has(ServiceKeys.PixiApp)) {
      const app = ServiceRegistry.get<PIXI.Application>(ServiceKeys.PixiApp);
      return app.renderer;
    }

    throw new Error('PIXI Renderer not available. Ensure PixiRenderer initialized first.');
  }

  private initializeParticleSystem(container: PIXI.Container, renderer?: PIXI.Renderer): void {
    this.particleContainer = new PIXI.Container();

    if (this.layerManager) {
      this.layerManager.addToLayer(LAYER_DEPTHS.PARTICLES, this.particleContainer);
    } else {
      container.addChild(this.particleContainer);
    }

    const pixiRenderer = this.resolveRenderer(renderer);
    this.particleSystem = new ParticleSystem(this.particleContainer, pixiRenderer, 2000);
    this.baseCameraPosition = { x: container.x, y: container.y };
  }

  private destroyParticleSystem(removeContainer: boolean): void {
    if (this.particleSystem) {
      this.particleSystem.destroy();
    }

    if (removeContainer && this.particleContainer?.parent) {
      this.particleContainer.removeChildren();
      this.particleContainer.parent.removeChild(this.particleContainer);
      this.particleContainer.destroy();
    }
  }
}
