// Scene Editor Types
import type { SpaceMood } from '@/game/components/SpaceBackgroundComponent';

export interface SceneObject {
  id: string;
  name: string;
  type: 'sprite' | 'spaceBackground' | 'container';
  x: number;
  y: number;
  scale: number;
  rotation: number;
  alpha: number;
  visible: boolean;
  children?: string[];
  parent?: string;
}

export interface SpriteObject extends SceneObject {
  type: 'sprite';
  texture: string;
  textureName?: string | null;
  tint: number;
  anchor: { x: number; y: number };
  filters?: FilterConfig[];
}

export interface SpaceBackgroundObject extends SceneObject {
  type: 'spaceBackground';
  mood: SpaceMood;
  config: {
    starCount: number;
    starBrightness: number;
    twinkleSpeed: number;
    nebulaIntensity: number;
    nebulaColor1: string;
    nebulaColor2: string;
    nebulaColor3: string;
    nebulaColor4: string;
    scanlineIntensity: number;
    scanlineSpeed: number;
  };
}

export interface FilterConfig {
  type: 'neonGlowScanline';
  enabled: boolean;
  glowColor: number;
  innerStrength: number;
  outerStrength: number;
  radius: number;
  samples: number;
  alphaThreshold: number;
  scanIntensity: number;
  scanSpeed: number;
}

export interface SceneState {
  objects: Record<string, SceneObject>;
  selectedObjectId: string | null;
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  grid: {
    enabled: boolean;
    size: number;
    opacity: number;
  };
}

export type PrefabDefaultConfig<T extends SceneObject = SceneObject> = Partial<T>;

export interface PrefabDefinition<T extends SceneObject = SceneObject> {
  id: string;
  name: string;
  type: 'sprite' | 'spaceBackground';
  icon: string;
  defaultConfig: PrefabDefaultConfig<T>;
}

export type SceneEditorMode = 'select' | 'move' | 'scale' | 'rotate';
