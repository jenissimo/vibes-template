// engine/scene/Scene.ts
import { GameObject } from "../GameObject";
import { Component } from "../Component";

export type UpdateStep = (deltaTime: number) => void;

export abstract class Scene {
  readonly gameObjects: GameObject[] = [];
  readonly preUpdateSteps: UpdateStep[] = [];
  readonly postUpdateSteps: UpdateStep[] = [];
  protected managers: any = null; // Менеджеры игры

  // Инициализация сцены с менеджерами
  initialize(managers: any) {
    this.managers = managers;
  }

  add(gameObject: GameObject) {
    this.gameObjects.push(gameObject);
    gameObject.scene = this;
    gameObject._onAddedToScene(this);
    return gameObject;
  }

  remove(gameObject: GameObject) {
    const index = this.gameObjects.indexOf(gameObject);
    if (index >= 0) {
      this.gameObjects[index] = this.gameObjects[this.gameObjects.length - 1];
      this.gameObjects.pop();
      gameObject.scene = null;
      gameObject._onRemovedFromScene();
    }
  }

  onEnter(_previousScene: Scene | null): void {}
  onExit(_nextScene: Scene | null): void {}
  onSuspend(): void {}
  onResume(): void {}

  update(deltaTime: number) {
    for (const step of this.preUpdateSteps) step(deltaTime);
    for (const gameObject of this.gameObjects) gameObject.update(deltaTime);
    for (const step of this.postUpdateSteps) step(deltaTime);
  }

  /**
   * Найти все GameObject'ы с определенным компонентом
   */
  findGameObjectsWithComponent<T extends Component>(componentType: new (...args: any[]) => T): GameObject[] {
    return this.gameObjects.filter(gameObject => 
      gameObject.has(componentType)
    );
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