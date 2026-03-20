// engine/scene/ComponentIndex.ts
import type { GameObject } from '../GameObject';

type ComponentType = new (...args: any[]) => any;

/**
 * O(1) component-type → Set<GameObject> lookup for a Scene.
 * Maintained automatically by Scene.add/remove and GameObject.add/remove.
 */
export class ComponentIndex {
  private index = new Map<Function, Set<GameObject>>();

  track(gameObject: GameObject, componentType: Function): void {
    let set = this.index.get(componentType);
    if (!set) {
      set = new Set();
      this.index.set(componentType, set);
    }
    set.add(gameObject);
  }

  untrack(gameObject: GameObject, componentType: Function): void {
    const set = this.index.get(componentType);
    if (set) {
      set.delete(gameObject);
      if (set.size === 0) this.index.delete(componentType);
    }
  }

  trackAll(gameObject: GameObject): void {
    for (const comp of gameObject.getComponents()) {
      this.track(gameObject, comp.constructor);
    }
  }

  untrackAll(gameObject: GameObject): void {
    for (const comp of gameObject.getComponents()) {
      this.untrack(gameObject, comp.constructor);
    }
  }

  query(type: ComponentType): ReadonlySet<GameObject> {
    return this.index.get(type) ?? emptySet;
  }

  clear(): void {
    this.index.clear();
  }
}

const emptySet: ReadonlySet<GameObject> = new Set();
