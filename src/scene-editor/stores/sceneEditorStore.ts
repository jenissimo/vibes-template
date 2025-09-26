// Scene Editor Store
import { map, atom } from 'nanostores';
import type { SceneState, SceneObject, SceneEditorMode } from '../types';

// Основное состояние сцены
export const sceneState = map<SceneState>({
  objects: {},
  selectedObjectId: null,
  viewport: {
    x: 0,
    y: 0,
    zoom: 1
  },
  grid: {
    enabled: true,
    size: 32,
    opacity: 0.3
  }
});

// Режим редактора
export const editorMode = atom<SceneEditorMode>('select');

// История изменений для undo/redo
export const history = atom<SceneState[]>([]);
export const historyIndex = atom<number>(-1);

// Actions
export function addObject(object: SceneObject) {
  const current = sceneState.get();
  const newObjects = { ...current.objects, [object.id]: object };
  
  // Сохраняем в историю
  saveToHistory();
  
  sceneState.set({
    ...current,
    objects: newObjects
  });
}

export function removeObject(objectId: string) {
  const current = sceneState.get();
  const newObjects = { ...current.objects };
  delete newObjects[objectId];
  
  // Удаляем из иерархии
  Object.values(newObjects).forEach(obj => {
    if (obj.children?.includes(objectId)) {
      obj.children = obj.children.filter(id => id !== objectId);
    }
  });
  
  // Если удаляемый объект был выбран - снимаем выбор
  const newSelectedId = current.selectedObjectId === objectId ? null : current.selectedObjectId;
  
  saveToHistory();
  
  sceneState.set({
    ...current,
    objects: newObjects,
    selectedObjectId: newSelectedId
  });
}

export function updateObject(objectId: string, updates: any) {
  const current = sceneState.get();
  const object = current.objects[objectId];
  if (!object) return;
  
  const updatedObject = { ...object, ...updates };
  const newObjects = { ...current.objects, [objectId]: updatedObject };
  
  saveToHistory();
  
  sceneState.set({
    ...current,
    objects: newObjects
  });
}

export function selectObject(objectId: string | null) {
  const current = sceneState.get();
  sceneState.set({
    ...current,
    selectedObjectId: objectId
  });
}

export function setViewport(x: number, y: number, zoom: number) {
  const current = sceneState.get();
  sceneState.set({
    ...current,
    viewport: { x, y, zoom }
  });
}

export function setGrid(enabled: boolean, size?: number, opacity?: number) {
  const current = sceneState.get();
  sceneState.set({
    ...current,
    grid: {
      enabled,
      size: size ?? current.grid.size,
      opacity: opacity ?? current.grid.opacity
    }
  });
}

export function setEditorMode(mode: SceneEditorMode) {
  editorMode.set(mode);
}

// История изменений
function saveToHistory() {
  const current = sceneState.get();
  const currentHistory = history.get();
  const currentIndex = historyIndex.get();
  
  // Удаляем все после текущего индекса
  const newHistory = currentHistory.slice(0, currentIndex + 1);
  newHistory.push(JSON.parse(JSON.stringify(current))); // deep clone
  
  // Ограничиваем историю 50 состояниями
  if (newHistory.length > 50) {
    newHistory.shift();
  } else {
    historyIndex.set(newHistory.length - 1);
  }
  
  history.set(newHistory);
}

export function undo() {
  const currentHistory = history.get();
  const currentIndex = historyIndex.get();
  
  if (currentIndex > 0) {
    const previousState = currentHistory[currentIndex - 1];
    sceneState.set(JSON.parse(JSON.stringify(previousState))); // deep clone
    historyIndex.set(currentIndex - 1);
  }
}

export function redo() {
  const currentHistory = history.get();
  const currentIndex = historyIndex.get();
  
  if (currentIndex < currentHistory.length - 1) {
    const nextState = currentHistory[currentIndex + 1];
    sceneState.set(JSON.parse(JSON.stringify(nextState))); // deep clone
    historyIndex.set(currentIndex + 1);
  }
}

// Утилиты
export function getSelectedObject(): SceneObject | null {
  const current = sceneState.get();
  return current.selectedObjectId ? current.objects[current.selectedObjectId] : null;
}

export function getObjectById(id: string): SceneObject | null {
  const current = sceneState.get();
  return current.objects[id] || null;
}

export function getAllObjects(): SceneObject[] {
  const current = sceneState.get();
  return Object.values(current.objects);
}

export function getRootObjects(): SceneObject[] {
  const current = sceneState.get();
  return Object.values(current.objects).filter(obj => !obj.parent);
}
