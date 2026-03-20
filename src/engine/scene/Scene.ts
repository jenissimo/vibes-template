// engine/scene/Scene.ts
import * as PIXI from 'pixi.js';
import { GameObject } from "../GameObject";
import { Component } from "../Component";
import { System } from "../systems/System";
import { ComponentIndex } from "./ComponentIndex";
import type { GameManagers } from "../types";

export type UpdateStep = (deltaTime: number) => void;

export abstract class Scene {
  readonly gameObjects: GameObject[] = [];
  readonly preUpdateSteps: UpdateStep[] = [];
  readonly postUpdateSteps: UpdateStep[] = [];
  readonly componentIndex = new ComponentIndex();
  /** Default container for PixiSpriteRenderer when none is explicitly provided. */
  defaultContainer: PIXI.Container | null = null;
  protected managers: GameManagers | null = null;
  protected systems: System[] = [];

  initialize(managers: GameManagers) {
    this.managers = managers;
  }

  add(gameObject: GameObject) {
    this.gameObjects.push(gameObject);
    gameObject.scene = this;
    gameObject._onAddedToScene(this);
    this.componentIndex.trackAll(gameObject);
    return gameObject;
  }

  remove(gameObject: GameObject) {
    const index = this.gameObjects.indexOf(gameObject);
    if (index >= 0) {
      this.gameObjects[index] = this.gameObjects[this.gameObjects.length - 1];
      this.gameObjects.pop();
      this.componentIndex.untrackAll(gameObject);
      gameObject.scene = null;
      gameObject._onRemovedFromScene();
    }
  }

  onEnter(_previousScene: Scene | null): void {}
  onExit(_nextScene: Scene | null): void {}
  onSuspend(): void {}
  onResume(): void {}

  addSystem<T extends System>(system: T): T {
    this.systems.push(system);
    system.start();
    return system;
  }

  removeSystem(system: System): void {
    const idx = this.systems.indexOf(system);
    if (idx >= 0) {
      this.systems[idx] = this.systems[this.systems.length - 1];
      this.systems.pop();
      system.destroy();
    }
  }

  getSystem<T extends System>(type: new (...args: any[]) => T): T | undefined {
    return this.systems.find((s): s is T => s instanceof type);
  }

  protected destroyAllSystems(): void {
    for (const s of this.systems) s.destroy();
    this.systems.length = 0;
  }

  /**
   * Public cleanup: destroys all systems (if scene forgot to) and clears componentIndex.
   * Called by SceneManager after onExit() as a defensive safety net.
   */
  destroy(): void {
    if (this.systems.length > 0) {
      this.destroyAllSystems();
    }
    this.componentIndex.clear();
  }

  update(deltaTime: number) {
    for (const step of this.preUpdateSteps) step(deltaTime);
    for (const s of this.systems) s.update(deltaTime);
    for (const gameObject of this.gameObjects) gameObject.update(deltaTime);
    for (const step of this.postUpdateSteps) step(deltaTime);
  }

  /**
   * O(1) query: all GameObjects that have the given component type.
   */
  getObjectsWith<T extends Component>(type: new (...args: any[]) => T): ReadonlySet<GameObject> {
    return this.componentIndex.query(type);
  }

  /**
   * Найти все GameObject'ы с определенным компонентом (array version, uses index)
   */
  findGameObjectsWithComponent<T extends Component>(componentType: new (...args: any[]) => T): GameObject[] {
    return Array.from(this.componentIndex.query(componentType));
  }

  /**
   * Найти все GameObject'ы с несколькими компонентами
   */
  findGameObjectsWithComponents<T extends Component>(...componentTypes: (new (...args: any[]) => T)[]): GameObject[] {
    return this.gameObjects.filter(gameObject => 
      componentTypes.every(componentType => gameObject.has(componentType))
    );
  }

  /**
   * Найти GameObject'ы в радиусе от точки
   */
  findGameObjectsInRadius<T extends Component>(
    centerX: number, 
    centerY: number, 
    radius: number, 
    componentType?: new (...args: any[]) => T
  ): GameObject[] {
    let candidates = componentType 
      ? this.findGameObjectsWithComponent(componentType)
      : this.gameObjects;

    return candidates.filter(gameObject => {
      const dx = gameObject.x - centerX;
      const dy = gameObject.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= radius;
    });
  }

  /**
   * Найти ближайший GameObject с компонентом
   */
  findNearestGameObjectWithComponent<T extends Component>(
    centerX: number,
    centerY: number,
    componentType: new (...args: any[]) => T
  ): GameObject | null {
    const candidates = this.findGameObjectsWithComponent(componentType);
    
    if (candidates.length === 0) return null;

    let nearest = candidates[0];
    let nearestDistance = Math.sqrt(
      Math.pow(nearest.x - centerX, 2) + Math.pow(nearest.y - centerY, 2)
    );

    for (let i = 1; i < candidates.length; i++) {
      const gameObject = candidates[i];
      const distance = Math.sqrt(
        Math.pow(gameObject.x - centerX, 2) + Math.pow(gameObject.y - centerY, 2)
      );
      
      if (distance < nearestDistance) {
        nearest = gameObject;
        nearestDistance = distance;
      }
    }

    return nearest;
  }
}