// engine/GameObject.ts
import { Component } from "./Component";
import type { Scene } from "./scene/Scene";

let nextGameObjectId = 0;

export class GameObject {
  id: number = nextGameObjectId++;
  name = "";
  x = 0;
  y = 0;
  rotation = 0;
  scale = 1;
  active = true;
  
  scene: Scene | null = null;
  private inScene = false;
  private components: Component[] = [];
  private componentIndex = new Map<Function, Component>();

  destroy(): void {
    if (this.scene) {
      this.scene.remove(this);
    }
  }

  addToScene(scene: Scene) {
    scene.add(this);
    return this;
  }
  
  add<T extends Component>(component: T) {
    // RequireComponent check
    const ctor = component.constructor as typeof Component;
    if (ctor.requiredComponents) {
      for (const req of ctor.requiredComponents) {
        if (!this.has(req)) {
          throw new Error(
            `[${this.name || `GO#${this.id}`}] ${ctor.name} requires ${req.name}, but it is missing. Add ${req.name} first.`
          );
        }
      }
    }

    this.components.push(component);
    this.componentIndex.set(component.constructor, component);
    component.gameObject = this;
    if (this.inScene) {
      component.scene = this.scene!;
      component.onAdded();
      // Notify scene's ComponentIndex
      this.scene!.componentIndex.track(this, component.constructor);
    }
    return this;
  }

  // Fluent API методы для chaining
  setName(name: string): this {
    this.name = name;
    return this;
  }

  setPosition(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  setRotation(rotation: number): this {
    this.rotation = rotation;
    return this;
  }

  setScale(scale: number): this {
    this.scale = scale;
    return this;
  }

  setActive(active: boolean): this {
    this.active = active;
    return this;
  }

  get<T extends Component>(ComponentClass: new (...args: any[]) => T): T | undefined {
    // Fast path for exact match
    const component = this.componentIndex.get(ComponentClass);
    if (component) {
      return component as T;
    }

    // Slow path for inherited classes
    for (const comp of this.components) {
      if (comp instanceof ComponentClass) {
        return comp as T;
      }
    }

    return undefined;
  }

  getComponents(): Component[] {
    return [...this.components];
  }

  has<T extends Component>(ComponentClass: new (...args: any[]) => T): boolean {
    // Fast path for exact match
    if (this.componentIndex.has(ComponentClass)) {
      return true;
    }

    // Slow path for inherited classes (also handles HMR where instanceof may fail
    // due to stale module references — fall back to constructor name comparison)
    for (const comp of this.components) {
      if (comp instanceof ComponentClass) {
        return true;
      }
      // HMR fallback: compare constructor names up the prototype chain
      let proto = Object.getPrototypeOf(comp);
      while (proto && proto.constructor !== Object) {
        if (proto.constructor.name === ComponentClass.name) {
          return true;
        }
        proto = Object.getPrototypeOf(proto);
      }
    }

    return false;
  }

  require<T extends Component>(ComponentClass: new (...args: any[]) => T) {
    const component = this.get(ComponentClass);
    if (!component) throw new Error(`[${this.name}] missing ${ComponentClass.name}`);
    return component;
  }

  remove<T extends Component>(ComponentClass: new (...args: any[]) => T) {
    const component = this.get(ComponentClass);
    if (!component) return;
    if (this.inScene) {
      component.onRemoved();
      this.scene!.componentIndex.untrack(this, ComponentClass);
    }
    this.componentIndex.delete(ComponentClass);
    const index = this.components.indexOf(component);
    if (index >= 0) {
      this.components[index] = this.components[this.components.length - 1];
      this.components.pop();
    }
  }

  _onAddedToScene(scene: Scene) {
    this.scene = scene;
    this.inScene = true;
    for (const component of this.components) {
      component.scene = scene;
      component.onAdded();
    }
  }

  _onRemovedFromScene() {
    for (let i = this.components.length - 1; i >= 0; i--) {
      this.components[i].onRemoved();
    }
    this.inScene = false;
  }

  update(deltaTime: number) {
    if (!this.active) return;
    for (const component of this.components) component.update(deltaTime);
  }

}
