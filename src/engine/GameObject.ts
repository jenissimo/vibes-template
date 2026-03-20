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
    this.components.push(component);
    this.componentIndex.set(component.constructor, component);
    component.gameObject = this;
    if (this.inScene) {
      component.scene = this.scene!;
      component.onAdded();
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
    
    // Slow path for inherited classes
    for (const comp of this.components) {
      if (comp instanceof ComponentClass) {
        return true;
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
    if (this.inScene) component.onRemoved();
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

  /**
   * @deprecated Use EventBus instead of stringly-typed message dispatch.
   * Will be removed in a future version.
   */
  sendMessage(methodName: string, value: unknown = null, options: SendMessageOptions = SendMessageOptions.RequireReceiver) {
    let messageHandled = false;

    for (const component of this.components) {
      const comp = component as unknown as Record<string, unknown>;
      if (typeof comp[methodName] === 'function') {
        try {
          (comp[methodName] as (v: unknown) => void)(value);
          messageHandled = true;
        } catch (error) {
          console.error(`Error calling ${methodName} on ${component.constructor.name}:`, error);
        }
      }
    }

    if (!messageHandled && options === SendMessageOptions.RequireReceiver) {
      console.warn(`SendMessage: No receiver found for ${methodName} on ${this.name}`);
    }
  }

  /**
   * @deprecated Use EventBus instead of stringly-typed message dispatch.
   * Will be removed in a future version.
   */
  sendMessageUpwards(methodName: string, value: unknown = null, options: SendMessageOptions = SendMessageOptions.RequireReceiver) {
    let messageHandled = false;

    for (const component of this.components) {
      const comp = component as unknown as Record<string, unknown>;
      if (typeof comp[methodName] === 'function') {
        try {
          (comp[methodName] as (v: unknown) => void)(value);
          messageHandled = true;
          break;
        } catch (error) {
          console.error(`Error calling ${methodName} on ${component.constructor.name}:`, error);
        }
      }
    }

    if (!messageHandled && options === SendMessageOptions.RequireReceiver) {
      console.warn(`SendMessageUpwards: No receiver found for ${methodName} on ${this.name}`);
    }
  }
}

export enum SendMessageOptions {
  RequireReceiver = 0,
  DontRequireReceiver = 1
}
