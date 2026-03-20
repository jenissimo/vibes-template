// engine/scene/SceneManager.ts
import { Scene } from "./Scene";
import type { GameManagers } from "../types";

export class SceneManagerInstance {
  private static instance: SceneManagerInstance;
  static getInstance(): SceneManagerInstance {
    return (SceneManagerInstance.instance ??= new SceneManagerInstance());
  }

  private sceneStack: Scene[] = [];
  
  get current() {
    return this.sceneStack.at(-1) ?? null;
  }
  
  switch(nextScene: Scene) {
    const previousScene = this.current;
    if (previousScene) previousScene.onExit(nextScene);
    this.sceneStack = [nextScene];
    nextScene.onEnter(previousScene);
  }

  /**
   * Горячая замена сцены для HMR
   * Корректно отписывает старую сцену и инициализирует новую
   */
  replace(newScene: Scene, managers?: GameManagers) {
    const previousScene = this.current;
    
    if (previousScene) {
      // 1. Отписываем старую сцену
      previousScene.onExit(newScene);

      // 2. Очищаем все GameObject'ы из старой сцены
      for (const gameObject of previousScene.gameObjects) {
        gameObject._onRemovedFromScene();
      }
      previousScene.gameObjects.length = 0;

      // 3. Defensive: destroy remaining systems & componentIndex if scene forgot
      previousScene.destroy();
    }
    
    // 3. Инициализируем новую сцену с менеджерами
    if (managers) {
      newScene.initialize(managers);
    }
    
    // 4. Заменяем сцену
    this.sceneStack = [newScene];
    newScene.onEnter(previousScene);
  }
  
  push(nextScene: Scene) {
    const previousScene = this.current;
    if (previousScene) previousScene.onSuspend();
    this.sceneStack.push(nextScene);
    nextScene.onEnter(previousScene);
  }
  
  pop() {
    const topScene = this.sceneStack.pop();
    const currentScene = this.current;
    if (topScene) topScene.onExit(currentScene);
    if (currentScene) currentScene.onResume();
  }
  
  update(deltaTime: number) {
    this.current?.update(deltaTime);
  }
}

export const sceneManager = SceneManagerInstance.getInstance();
/** @deprecated Use `sceneManager` instead */
export const SceneManager = () => sceneManager;