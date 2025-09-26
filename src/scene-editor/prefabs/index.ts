// Scene Editor Prefabs
import type { PrefabDefinition, SpriteObject, SpaceBackgroundObject } from '../types';

// Базовые префабы спрайтов
export const SPRITE_PREFABS: PrefabDefinition<SpriteObject>[] = [
  {
    id: 'sprite-basic',
    name: 'Basic Sprite',
    type: 'sprite',
    icon: 'sprite',
    defaultConfig: {
      name: 'New Sprite',
      type: 'sprite',
      x: 500,
      y: 1000,
      scale: 1, // Разумный масштаб для видимости
      rotation: 0,
      alpha: 1,
      visible: true,
      texture: 'placeholder', // заглушка для пустой текстуры
      tint: 0x888888, // серый цвет для заглушки
      anchor: { x: 0.5, y: 0.5 }
    }
  },
  {
    id: 'sprite-neon-glow',
    name: 'Neon Glow Sprite',
    type: 'sprite',
    icon: 'neon-sprite',
    defaultConfig: {
      name: 'Neon Sprite',
      type: 'sprite',
      x: 500,
      y: 1000,
      scale: 1, // Разумный масштаб для видимости
      rotation: 0,
      alpha: 1,
      visible: true,
      texture: 'placeholder', // заглушка для пустой текстуры
      tint: 0x8b5cf6,
      anchor: { x: 0.5, y: 0.5 },
      filters: [{
        type: 'neonGlowScanline',
        enabled: true,
        glowColor: 0x8b5cf6,
        innerStrength: 0.75,
        outerStrength: 2.5,
        radius: 6.0,
        samples: 12,
        alphaThreshold: 0.01,
        scanIntensity: 0.25,
        scanSpeed: 1.6
      }]
    }
  }
];

// Префаб для космического фона
export const SPACE_BACKGROUND_PREFAB: PrefabDefinition<SpaceBackgroundObject> = {
  id: 'space-background',
  name: 'Space Background',
  type: 'spaceBackground',
  icon: 'space-bg',
  defaultConfig: {
    name: 'Space Background',
    type: 'spaceBackground',
    x: 0,
    y: 0,
      scale: 1,
    rotation: 0,
    alpha: 1,
    visible: true,
    mood: 'cosmic',
    config: {
      starCount: 100,
      starBrightness: 2.0,
      twinkleSpeed: 1.2,
      nebulaIntensity: 1.1,
      nebulaColor1: '#0a0a2e',
      nebulaColor2: '#1a1a5e',
      nebulaColor3: '#4a4a9e',
      nebulaColor4: '#8b5cf6',
      scanlineIntensity: 0.3,
      scanlineSpeed: 1.0
    }
  }
};

// Все доступные префабы
export const ALL_PREFABS: PrefabDefinition[] = [
  ...SPRITE_PREFABS,
  SPACE_BACKGROUND_PREFAB
];

// Функции для создания объектов из префабов
export function createObjectFromPrefab(prefabId: string, id: string): SpriteObject | SpaceBackgroundObject | null {
  const prefab = ALL_PREFABS.find(p => p.id === prefabId);
  if (!prefab) return null;
  
  const baseConfig = { ...prefab.defaultConfig, id } as any;
  
  if (prefab.type === 'sprite') {
    return baseConfig as SpriteObject;
  } else if (prefab.type === 'spaceBackground') {
    return baseConfig as SpaceBackgroundObject;
  }
  
  return null;
}

export function getPrefabById(id: string): PrefabDefinition | null {
  return ALL_PREFABS.find(p => p.id === id) || null;
}

export function getPrefabsByType(type: 'sprite' | 'spaceBackground'): PrefabDefinition[] {
  return ALL_PREFABS.filter(p => p.type === type);
}
