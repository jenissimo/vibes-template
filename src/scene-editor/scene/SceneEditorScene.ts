// Scene Editor Scene
import { Scene } from '@/engine/scene/Scene';
import { GameObject } from '@/engine/GameObject';
import { SpaceBackgroundComponent, SPACE_PRESETS } from '@/game/components/SpaceBackgroundComponent';
import { PixiSpriteRenderer } from '@/engine/components/PixiSpriteRenderer';
import { logger } from '@/engine/logging';
import { eventBus } from '@/engine/events/EventBus';
import { computeLayout, readSafeInsets } from '@/engine/render/LayoutEngine';
import { RENDER_CONFIG } from '@/engine/render/RenderConfig';
import { sceneState, getAllObjects, editorMode, selectObject } from '../stores/sceneEditorStore';
import type { SceneObject, SpriteObject, SpaceBackgroundObject, SceneEditorMode, FilterConfig } from '../types';
import * as PIXI from 'pixi.js';
import { CoordinateService } from '@/engine';
import { ServiceRegistry, ServiceKeys } from '@/engine/registry';
import { NeonGlowScanlineFilter } from '@/game/graphics/filters/NeonGlowScanlineFilter';

export class SceneEditorScene extends Scene {
  private stage?: PIXI.Container;
  private bgContainer?: PIXI.Container;
  private contentContainer?: PIXI.Container;
  private sceneObjects: Map<string, PixiSpriteRenderer> = new Map();
  private viewport: PIXI.Container;
  private grid?: PIXI.Graphics;
  private spaceBackground?: SpaceBackgroundComponent;
  private bgWidth = RENDER_CONFIG.referenceResolution.w;
  private bgHeight = RENDER_CONFIG.referenceResolution.h;
  private gameWidth = RENDER_CONFIG.referenceResolution.w;
  private gameHeight = RENDER_CONFIG.referenceResolution.h;
  private resizeUnsub: (() => void) | null = null;
  private unsubscribeState: (() => void) | null = null;
  
  // Mouse interaction state
  private isDragging = false;
  private dragStartPos = { x: 0, y: 0 };
  private dragStartObjectPos = { x: 0, y: 0 };
  private dragStartObjectScale = 1;
  private dragStartObjectRotation = 0;
  private currentMode: SceneEditorMode = 'select';
  private unsubscribeMode: (() => void) | null = null;

  constructor() {
    super();
    this.viewport = new PIXI.Container();
  }

  onEnter(previousScene: Scene | null) {
    super.onEnter(previousScene);

    this.stage = this.resolveStage();
    this.initContainers();
    this.createBackground();
    this.createGrid();
    this.loadExistingObjects();
    this.subscribeToState();
    this.subscribeToMode();
    this.subscribeToResize();
    this.setupMouseInteraction();
    this.relayout();

    // Отладочная информация
    logger.info('🎬 SceneEditorScene initialized', { 
      source: 'scene-editor',
      stage: !!this.stage,
      bgContainer: !!this.bgContainer,
      contentContainer: !!this.contentContainer,
      viewport: !!this.viewport,
      grid: !!this.grid,
      spaceBackground: !!this.spaceBackground,
      sceneObjectsCount: this.sceneObjects.size
    });
  }

  onExit(nextScene: Scene | null) {
    super.onExit(nextScene);

    this.unsubscribeState?.();
    this.unsubscribeState = null;
    this.unsubscribeMode?.();
    this.unsubscribeMode = null;
    this.unsubscribeResize();

    this.sceneObjects.forEach(renderer => renderer.destroy());
    this.sceneObjects.clear();

    // Ручное управление служебными элементами
    this.grid?.destroy();
    this.grid = undefined;

    // ECS автоматически удалит GameObjects и их компоненты
    this.spaceBackground = undefined;

    this.bgContainer?.removeFromParent();
    this.contentContainer?.removeFromParent();
    this.bgContainer = undefined;
    this.contentContainer = undefined;
    this.stage = undefined;
  }

  update(deltaTime: number) {
    super.update(deltaTime);
    
    // Обновляем все объекты сцены
    this.sceneObjects.forEach(renderer => {
      renderer.update(deltaTime);
    });
    
    // Обновляем фильтры (для анимированных эффектов)
    const state = sceneState.get();
    Object.values(state.objects).forEach(object => {
      if (object.type === 'sprite') {
        const renderer = this.sceneObjects.get(object.id);
        if (renderer) {
          const spriteRenderer = (renderer as any).spriteRenderer;
          if (spriteRenderer.sprite.filters) {
            spriteRenderer.sprite.filters.forEach((filter: any) => {
              if (filter.update) {
                filter.update(deltaTime);
              }
            });
          }
        }
      }
    });
    
    // Обновляем фон
    if (this.spaceBackground) {
      this.spaceBackground.update(deltaTime);
    }
  }

  // Resize обрабатывается через eventBus в main.ts
  // Здесь только обновляем внутренние компоненты
  // ——— Публичные методы ———

  /** Добавить объект в сцену */
  async addSceneObject(object: SceneObject) {
    logger.info('➕ Adding scene object', {
      source: 'scene-editor',
      id: object.id,
      type: object.type,
      name: object.name
    });
    
    if (object.type === 'spaceBackground') {
      this.updateSpaceBackground(object as SpaceBackgroundObject);
    } else if (object.type === 'sprite') {
      await this.createSpriteObject(object as SpriteObject);
    } else {
      logger.warn('⚠️ Unknown object type', {
        source: 'scene-editor',
        id: object.id,
        type: object.type
      });
    }
  }

  /** Удалить объект из сцены */
  removeSceneObject(objectId: string) {
    const renderer = this.sceneObjects.get(objectId);
    if (renderer) {
      renderer.destroy();
      this.sceneObjects.delete(objectId);
    }
  }

  /** Обновить объект в сцене */
  async updateSceneObject(object: SceneObject) {
    if (object.type === 'spaceBackground') {
      this.updateSpaceBackground(object as SpaceBackgroundObject);
    } else if (object.type === 'sprite') {
      await this.updateSpriteObject(object as SpriteObject);
    }
  }

  /** Получить объект по ID */
  getSceneObject(objectId: string): PixiSpriteRenderer | null {
    return this.sceneObjects.get(objectId) || null;
  }

  // ——— Приватные методы ———

  /** Создать фильтры из конфигурации */
  private createFiltersFromConfig(filters?: FilterConfig[]): PIXI.Filter[] {
    if (!filters || filters.length === 0) return [];
    
    const pixiFilters: PIXI.Filter[] = [];
    
    for (const filterConfig of filters) {
      if (!filterConfig.enabled) continue;
      
      switch (filterConfig.type) {
        case 'neonGlowScanline':
          const neonFilter = new NeonGlowScanlineFilter({
            glowColor: filterConfig.glowColor,
            innerStrength: filterConfig.innerStrength,
            outerStrength: filterConfig.outerStrength,
            radius: filterConfig.radius,
            samples: filterConfig.samples,
            alphaThreshold: filterConfig.alphaThreshold,
            scanIntensity: filterConfig.scanIntensity,
            scanSpeed: filterConfig.scanSpeed
          });
          pixiFilters.push(neonFilter);
          break;
          
        default:
          logger.warn('⚠️ Unknown filter type', {
            source: 'scene-editor',
            filterType: filterConfig.type
          });
      }
    }
    
    logger.info('🎨 Filters created', {
      source: 'scene-editor',
      filtersCount: pixiFilters.length,
      filterTypes: filters.map(f => f.type)
    });
    
    return pixiFilters;
  }

  /** Обновить фильтры для объекта */
  private updateObjectFilters(object: SpriteObject) {
    const renderer = this.sceneObjects.get(object.id);
    if (!renderer) return;
    
    const spriteRenderer = (renderer as any).spriteRenderer;
    const filters = this.createFiltersFromConfig(object.filters);
    
    spriteRenderer.setFilters(filters);
    
    logger.info('🎨 Object filters updated', {
      source: 'scene-editor',
      id: object.id,
      filtersCount: filters.length
    });
  }

  private resolveStage(): PIXI.Container {
    if (this.managers?.stage) return this.managers.stage as PIXI.Container;
    if (this.managers?.render?.stage) return this.managers.render.stage as PIXI.Container;

    const err = new Error('SceneEditorScene: stage container missing');
    logger.error('❌ SceneEditorScene initialization failed', err);
    throw err;
  }

  private initContainers() {
    if (!this.stage) return;

    this.bgContainer = new PIXI.Container();
    this.contentContainer = new PIXI.Container();

    // Включаем сортировку по zIndex для правильного отображения слоев
    this.stage.sortableChildren = true;
    this.contentContainer.sortableChildren = true;
    this.viewport.sortableChildren = true;

    this.stage.addChild(this.bgContainer, this.contentContainer);
    this.contentContainer.addChild(this.viewport);

    logger.info('📦 Containers initialized', {
      source: 'scene-editor',
      stage: !!this.stage,
      bgContainer: !!this.bgContainer,
      contentContainer: !!this.contentContainer,
      viewport: !!this.viewport,
      stageChildren: this.stage.children.length,
      contentContainerChildren: this.contentContainer.children.length,
      viewportChildren: this.viewport.children.length
    });
  }

  private createBackground() {
    if (!this.bgContainer) {
      logger.warn('⚠️ bgContainer is null, cannot create background', { source: 'scene-editor' });
      return;
    }

    this.spaceBackground = new SpaceBackgroundComponent(this.bgContainer, {
      width: this.bgWidth,
      height: this.bgHeight,
      ...SPACE_PRESETS.cosmic,
    });
    
    // Добавляем в ECS как GameObject
    this.add(new GameObject().setName('SpaceBackground').add(this.spaceBackground));
    
    logger.info('🌌 Space background created', { 
      source: 'scene-editor',
      bgContainer: !!this.bgContainer,
      spaceBackground: !!this.spaceBackground,
      width: this.bgWidth,
      height: this.bgHeight
    });
  }

  private createGrid() {
    this.grid?.destroy();
    this.grid = new PIXI.Graphics();
    
    // Grid в bgContainer над фоном, ниже контента
    this.grid.zIndex = 50;
    this.bgContainer?.addChild(this.grid);
    this.updateGrid();
    
    logger.info('🔲 Grid created', { 
      source: 'scene-editor',
      grid: !!this.grid,
      bgContainer: !!this.bgContainer,
      gridVisible: this.grid.visible,
      zIndex: this.grid.zIndex
    });
  }

  private subscribeToState() {
    if (this.unsubscribeState) return;
    this.unsubscribeState = sceneState.subscribe(async state => {
    logger.info('📡 State changed', {
      source: 'scene-editor',
      objectsCount: Object.keys(state.objects).length,
      selectedId: state.selectedObjectId,
      viewport: state.viewport,
      viewportPosition: { x: this.viewport.position.x, y: this.viewport.position.y },
      viewportScale: { x: this.viewport.scale.x, y: this.viewport.scale.y }
    });
      
      this.viewport.position.set(state.viewport.x, state.viewport.y);
      this.viewport.scale.set(state.viewport.zoom);
      this.updateGrid();
      await this.syncSceneObjects(state.objects);
    });
  }

  private subscribeToResize() {
    this.unsubscribeResize();
    const handler = this.onResize.bind(this);
    eventBus.on('window-resize', handler);
    this.resizeUnsub = () => eventBus.off('window-resize', handler);
  }

  private unsubscribeResize() {
    this.resizeUnsub?.();
    this.resizeUnsub = null;
  }

  private onResize() {
    this.relayout();
  }

  private relayout() {
    if (!this.stage || !this.bgContainer || !this.contentContainer) return;

    const insets = readSafeInsets();
    const layout = computeLayout(window.innerWidth, window.innerHeight, insets);

    CoordinateService.getInstance().setLayout(layout);

    this.bgWidth = layout.bg.w;
    this.bgHeight = layout.bg.h;
    this.gameWidth = layout.game.w;
    this.gameHeight = layout.game.h;

    this.bgContainer.position.set(layout.bg.x, layout.bg.y);
    this.bgContainer.hitArea = new PIXI.Rectangle(0, 0, layout.bg.w, layout.bg.h);
    this.spaceBackground?.resize(layout.bg.w, layout.bg.h);

    this.contentContainer.position.set(layout.game.x, layout.game.y);
    this.contentContainer.scale.set(layout.scaleGame);
    this.contentContainer.hitArea = new PIXI.Rectangle(0, 0, layout.game.w, layout.game.h);

    // Настраиваем viewport для scene editor
    this.viewport.hitArea = new PIXI.Rectangle(0, 0, layout.game.w, layout.game.h);

    logger.info('🔄 Relayout completed', {
      source: 'scene-editor',
      gameWidth: this.gameWidth,
      gameHeight: this.gameHeight,
      viewportPosition: { x: this.viewport.position.x, y: this.viewport.position.y },
      viewportScale: { x: this.viewport.scale.x, y: this.viewport.scale.y }
    });

    this.updateGrid();
  }

  private updateSpaceBackground(object: SpaceBackgroundObject) {
    this.spaceBackground?.destroy();

    const targetContainer = this.bgContainer ?? this.contentContainer ?? this.viewport;
    if (!targetContainer) return;

    this.spaceBackground = new SpaceBackgroundComponent(targetContainer, {
      width: this.bgWidth,
      height: this.bgHeight,
      ...object.config
    });
    this.spaceBackground.setSpaceMood(object.mood);
  }

  private async createSpriteObject(object: SpriteObject) {
    logger.info('🎨 Creating sprite object with ECS architecture', {
      source: 'scene-editor',
      id: object.id,
      texture: object.texture,
      textureName: object.textureName,
      position: { x: object.x, y: object.y },
      scale: object.scale
    });
    
    // Создаем GameObject
    const gameObject = new GameObject()
      .setName(object.name)
      .setPosition(object.x, object.y)
      .setRotation(object.rotation)
      .setScale(object.scale)
      .setActive(object.visible);
    
    // Создаем текстуру
    let texture: PIXI.Texture;
    if (object.texture === 'placeholder') {
      // Создаем заглушку через Graphics
      const graphics = new PIXI.Graphics();
      const size = object.scale > 100 ? object.scale : 64;
      
      // Заглушка для пустой текстуры
      graphics.beginFill(0x000000, 0);
      graphics.drawRect(-size/2, -size/2, size, size);
      graphics.endFill();
      
      // Рамка для видимости
      graphics.lineStyle(2, object.tint, object.alpha);
      graphics.drawRect(-size/2, -size/2, size, size);
      
      // Текст "No Texture" в центре
      graphics.beginFill(object.tint, 0.3);
      graphics.drawRect(-size/4, -8, size/2, 16);
      graphics.endFill();
      
      // Конвертируем Graphics в текстуру
      const pixiApp = ServiceRegistry.get(ServiceKeys.PixiApp) as PIXI.Application;
      texture = pixiApp.renderer.generateTexture(graphics);
    } else {
      // Загружаем настоящую текстуру
      try {
        if (object.texture.startsWith('blob:')) {
          // Загружаем blob URL с правильным синтаксисом PIXI v8
          texture = await PIXI.Assets.load({
            src: object.texture,
            format: 'png',
            loadParser: 'loadTextures'
          });
        } else {
          texture = PIXI.Texture.from(object.texture);
        }
        
        logger.info('🖼️ Real texture loaded', {
          source: 'scene-editor',
          id: object.id,
          textureUrl: object.texture,
          textureName: object.textureName,
          textureSize: { width: texture.width, height: texture.height }
        });
      } catch (error) {
        logger.error('❌ Failed to load texture', error as Error, {
          source: 'scene-editor',
          id: object.id,
          textureUrl: object.texture
        });
        // Fallback к белой текстуре
        texture = PIXI.Texture.WHITE;
      }
    }
    
    // Создаем PixiSpriteRenderer
    const spriteRenderer = new PixiSpriteRenderer(this.viewport, {
      texture,
      anchor: object.anchor,
      tint: object.tint,
      alpha: object.alpha,
      visible: object.visible
    });
    
    // Применяем фильтры если есть
    const filters = this.createFiltersFromConfig(object.filters);
    if (filters.length > 0) {
      spriteRenderer.setFilters(filters);
    }
    
    // Добавляем компонент к GameObject
    gameObject.add(spriteRenderer);
    
    // Добавляем в сцену (это автоматически добавит спрайт в viewport)
    this.add(gameObject);
    
    // Сохраняем в Map для управления
    this.sceneObjects.set(object.id, {
      gameObject,
      spriteRenderer,
      sprite: spriteRenderer.sprite, // для совместимости
      destroy: () => {
        this.remove(gameObject);
        gameObject._onRemovedFromScene();
      },
      update: () => {
        // ECS автоматически обновляет компоненты
      }
    } as any);
    
    logger.info('✅ Sprite object created', {
      source: 'scene-editor',
      id: object.id,
      gameObjectName: gameObject.name,
      spriteVisible: spriteRenderer.sprite.visible,
      sceneObjectsCount: this.sceneObjects.size
    });
  }

  private async updateSpriteObject(object: SpriteObject) {
    const renderer = this.sceneObjects.get(object.id);
    if (!renderer) {
      logger.warn('⚠️ No renderer found for object', {
        source: 'scene-editor',
        id: object.id,
        sceneObjectsCount: this.sceneObjects.size
      });
      return;
    }
    
    const gameObject = (renderer as any).gameObject;
    const spriteRenderer = (renderer as any).spriteRenderer;
    
    logger.info('🔄 Updating sprite object with ECS', {
      source: 'scene-editor',
      id: object.id,
      texture: object.texture,
      position: { x: object.x, y: object.y },
      scale: object.scale,
      visible: object.visible
    });
    
    // Обновляем GameObject свойства
    gameObject.setName(object.name);
    gameObject.setPosition(object.x, object.y);
    gameObject.setRotation(object.rotation);
    gameObject.setScale(object.scale);
    gameObject.setActive(object.visible);
    
    // Обновляем SpriteRenderer свойства
    spriteRenderer.setTint(object.tint);
    spriteRenderer.setAlpha(object.alpha);
    spriteRenderer.setVisible(object.visible);
    
    // Обновляем фильтры
    this.updateObjectFilters(object);
    
    // Если изменилась текстура, обновляем её
    if (object.texture !== 'placeholder') {
      try {
        // Для blob URL используем специальный подход
        let newTexture: PIXI.Texture;
        
        if (object.texture.startsWith('blob:')) {
          // Загружаем blob URL с правильным синтаксисом PIXI v8
          newTexture = await PIXI.Assets.load({
            src: object.texture,
            format: 'png', // или определять по расширению файла
            loadParser: 'loadTextures'
          });
          
          logger.info('🖼️ Blob texture loaded via Assets', {
            source: 'scene-editor',
            id: object.id,
            textureUrl: object.texture
          });
        } else {
          // Для обычных URL используем стандартный метод
          newTexture = PIXI.Texture.from(object.texture);
        }
        
        spriteRenderer.setTexture(newTexture);
        logger.info('🖼️ Texture updated in sprite renderer', {
          source: 'scene-editor',
          id: object.id,
          textureUrl: object.texture,
          textureName: object.textureName,
          textureSize: { width: newTexture.width, height: newTexture.height }
        });
      } catch (error) {
        logger.error('❌ Failed to update texture', error as Error, {
          source: 'scene-editor',
          id: object.id,
          textureUrl: object.texture
        });
      }
    } else {
      // Если вернулись к placeholder, создаем заглушку
      const graphics = new PIXI.Graphics();
      const size = object.scale > 100 ? object.scale : 64;
      
      graphics.beginFill(0x000000, 0);
      graphics.drawRect(-size/2, -size/2, size, size);
      graphics.endFill();
      
      graphics.lineStyle(2, object.tint, object.alpha);
      graphics.drawRect(-size/2, -size/2, size, size);
      
      graphics.beginFill(object.tint, 0.3);
      graphics.drawRect(-size/4, -8, size/2, 16);
      graphics.endFill();
      
      const pixiApp = ServiceRegistry.get(ServiceKeys.PixiApp) as PIXI.Application;
      const placeholderTexture = pixiApp.renderer.generateTexture(graphics);
      spriteRenderer.setTexture(placeholderTexture);
      
      logger.info('🔄 Reverted to placeholder texture', {
        source: 'scene-editor',
        id: object.id
      });
    }
    
    logger.info('🔄 Sprite object updated', {
      source: 'scene-editor',
      id: object.id,
      gameObjectName: gameObject.name,
      position: { x: object.x, y: object.y },
      texture: object.texture
    });
  }

  private updateGrid() {
    if (!this.grid) return;
    
    const state = sceneState.get();
    if (!state.grid.enabled) {
      this.grid.visible = false;
      return;
    }
    
    this.grid.clear();
    this.grid.visible = true;
    this.grid.alpha = state.grid.opacity;
    
    // Сетка в bgContainer, статичная позиция
    this.grid.position.set(0, 0);

    const gridSize = state.grid.size;
    
    // Не рисуем сетку, если ячейки слишком мелкие или крупные
    if (gridSize < 5 || gridSize > 5000) {
        logger.info('🔲 Grid too small/large, skipping', {
          source: 'scene-editor',
          gridSize,
          minSize: 5,
          maxSize: 5000
        });
        return;
    }

    // Рисуем сетку тонкими серыми линиями
    this.grid.stroke({ width: 1, color: 0x666666, alpha: 0.3 });
    
    // Вертикальные линии
    for (let x = 0; x <= this.bgWidth; x += gridSize) {
      this.grid.moveTo(x, 0);
      this.grid.lineTo(x, this.bgHeight);
      this.grid.stroke({ width: 1, color: 0x666666, alpha: 0.3 });
    }
    
    // Горизонтальные линии
    for (let y = 0; y <= this.bgHeight; y += gridSize) {
      this.grid.moveTo(0, y);
      this.grid.lineTo(this.bgWidth, y);
      this.grid.stroke({ width: 1, color: 0x666666, alpha: 0.3 });
    }
    
    logger.info('🔲 Grid updated', {
      source: 'scene-editor',
      gridVisible: this.grid.visible,
      gridAlpha: this.grid.alpha,
      gridSize,
      bgWidth: this.bgWidth,
      bgHeight: this.bgHeight
    });
  }

  private loadExistingObjects() {
    const objects = getAllObjects();
    objects.forEach(object => {
      this.addSceneObject(object);
    });
  }

  private async syncSceneObjects(objects: Record<string, SceneObject>) {
    const currentIds = new Set(Object.keys(objects));
    const sceneIds = new Set(this.sceneObjects.keys());
    
    logger.info('🔄 Syncing scene objects', {
      source: 'scene-editor',
      currentIds: Array.from(currentIds),
      sceneIds: Array.from(sceneIds),
      objectsCount: Object.keys(objects).length,
      sceneObjectsCount: this.sceneObjects.size,
      objects: Object.values(objects).map(obj => ({ id: obj.id, type: obj.type, name: obj.name }))
    });
    
    // Удаляем объекты, которых нет в состоянии
    sceneIds.forEach(id => {
      if (!currentIds.has(id)) {
        logger.info('🗑️ Removing object', { source: 'scene-editor', id });
        this.removeSceneObject(id);
      }
    });
    
    // Добавляем/обновляем объекты
    for (const object of Object.values(objects)) {
      if (sceneIds.has(object.id)) {
        logger.info('🔄 Updating object', { 
          source: 'scene-editor', 
          id: object.id, 
          type: object.type,
          name: object.name,
          position: object.type === 'sprite' ? { x: (object as any).x, y: (object as any).y } : null
        });
        await this.updateSceneObject(object);
      } else {
        logger.info('➕ Adding object', { 
          source: 'scene-editor', 
          id: object.id, 
          type: object.type,
          name: object.name,
          position: object.type === 'sprite' ? { x: (object as any).x, y: (object as any).y } : null
        });
        await this.addSceneObject(object);
      }
    }
    
    logger.info('🔄 Sync completed', {
      source: 'scene-editor',
      finalSceneObjectsCount: this.sceneObjects.size,
      viewportChildren: this.viewport.children.length
    });
  }

  private subscribeToMode() {
    if (this.unsubscribeMode) return;
    this.unsubscribeMode = editorMode.subscribe(mode => {
      this.currentMode = mode;
      this.updateCursor();
    });
  }

  private setupMouseInteraction() {
    if (!this.viewport) return;

    // Enable interaction
    this.viewport.interactive = true;
    this.viewport.cursor = this.getCursorForMode(this.currentMode);

    // Mouse events
    this.viewport.on('pointerdown', this.onPointerDown.bind(this));
    this.viewport.on('pointermove', this.onPointerMove.bind(this));
    this.viewport.on('pointerup', this.onPointerUp.bind(this));
    this.viewport.on('pointerupoutside', this.onPointerUp.bind(this));

    // Prevent context menu
    this.viewport.on('rightdown', (e) => e.preventDefault());
  }

  private getCursorForMode(mode: SceneEditorMode): string {
    switch (mode) {
      case 'select': return 'default';
      case 'move': return 'move';
      case 'scale': return 'nw-resize';
      case 'rotate': return 'grab';
      default: return 'default';
    }
  }

  private updateCursor() {
    if (!this.viewport) return;
    this.viewport.cursor = this.getCursorForMode(this.currentMode);
  }

  private onPointerDown(event: PIXI.FederatedPointerEvent) {
    if (!this.viewport) return;

    const globalPos = event.global;
    const localPos = this.viewport.toLocal(globalPos);
    
    this.dragStartPos = { x: localPos.x, y: localPos.y };
    this.isDragging = true;

    // Find object under cursor
    const hitObject = this.findObjectAtPosition(localPos.x, localPos.y);
    
    if (hitObject) {
      selectObject(hitObject.id);
      
      if (this.currentMode === 'move' || this.currentMode === 'scale' || this.currentMode === 'rotate') {
        const renderer = this.sceneObjects.get(hitObject.id);
        if (renderer) {
          this.dragStartObjectPos = { 
            x: renderer.sprite.position.x, 
            y: renderer.sprite.position.y 
          };
          this.dragStartObjectScale = renderer.sprite.scale.x;
          this.dragStartObjectRotation = renderer.sprite.rotation;
        }
      }
    } else {
      selectObject(null);
    }

    logger.info('🖱️ Pointer down', {
      source: 'scene-editor',
      mode: this.currentMode,
      position: localPos,
      hitObject: hitObject?.id || null,
      isDragging: this.isDragging
    });
  }

  private onPointerMove(event: PIXI.FederatedPointerEvent) {
    if (!this.isDragging || !this.viewport) return;

    const globalPos = event.global;
    const localPos = this.viewport.toLocal(globalPos);
    
    const deltaX = localPos.x - this.dragStartPos.x;
    const deltaY = localPos.y - this.dragStartPos.y;

    const state = sceneState.get();
    const selectedObject = state.selectedObjectId ? state.objects[state.selectedObjectId] : null;

    if (selectedObject) {
      if (this.currentMode === 'move') {
        const newX = this.dragStartObjectPos.x + deltaX;
        const newY = this.dragStartObjectPos.y + deltaY;
        this.updateObjectPosition(selectedObject.id, newX, newY);
      } else if (this.currentMode === 'scale') {
        // Scale based on distance from object center
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const scaleFactor = 1 + (distance / 100); // Adjust sensitivity
        const newScale = Math.max(0.1, this.dragStartObjectScale * scaleFactor);
        this.updateObjectScale(selectedObject.id, newScale);
      } else if (this.currentMode === 'rotate') {
        // Calculate angle from object center
        const angle = Math.atan2(deltaY, deltaX);
        const newRotation = this.dragStartObjectRotation + angle;
        this.updateObjectRotation(selectedObject.id, newRotation);
      }
    }

    logger.info('🖱️ Pointer move', {
      source: 'scene-editor',
      mode: this.currentMode,
      position: localPos,
      delta: { x: deltaX, y: deltaY },
      selectedObject: selectedObject?.id || null
    });
  }

  private onPointerUp(_event: PIXI.FederatedPointerEvent) {
    this.isDragging = false;
    
    logger.info('🖱️ Pointer up', {
      source: 'scene-editor',
      mode: this.currentMode,
      isDragging: this.isDragging
    });
  }

  private findObjectAtPosition(x: number, y: number): SceneObject | null {
    const state = sceneState.get();
    
    // Check objects in reverse order (top to bottom)
    const objects = Object.values(state.objects).sort((a, b) => {
      const aRenderer = this.sceneObjects.get(a.id);
      const bRenderer = this.sceneObjects.get(b.id);
      return (bRenderer?.sprite.zIndex || 0) - (aRenderer?.sprite.zIndex || 0);
    });

    for (const object of objects) {
      if (object.type === 'sprite') {
        const renderer = this.sceneObjects.get(object.id);
        if (renderer && this.isPointInSprite(x, y, renderer.sprite)) {
          return object;
        }
      }
    }

    return null;
  }

  private isPointInSprite(x: number, y: number, sprite: PIXI.Sprite): boolean {
    const bounds = sprite.getBounds();
    return x >= bounds.x && x <= bounds.x + bounds.width &&
           y >= bounds.y && y <= bounds.y + bounds.height;
  }

  private updateObjectPosition(objectId: string, x: number, y: number) {
    const state = sceneState.get();
    const object = state.objects[objectId];
    if (!object) return;

    // Update through store to trigger re-render
    const updatedObject = { ...object, x, y };
    const newObjects = { ...state.objects, [objectId]: updatedObject };
    
    sceneState.set({
      ...state,
      objects: newObjects
    });
  }

  private updateObjectScale(objectId: string, scale: number) {
    const state = sceneState.get();
    const object = state.objects[objectId];
    if (!object) return;

    const updatedObject = { ...object, scale };
    const newObjects = { ...state.objects, [objectId]: updatedObject };
    
    sceneState.set({
      ...state,
      objects: newObjects
    });
  }

  private updateObjectRotation(objectId: string, rotation: number) {
    const state = sceneState.get();
    const object = state.objects[objectId];
    if (!object) return;

    const updatedObject = { ...object, rotation };
    const newObjects = { ...state.objects, [objectId]: updatedObject };
    
    sceneState.set({
      ...state,
      objects: newObjects
    });
  }
}