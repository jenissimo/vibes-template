import { EffectSystem } from './EffectSystem';

// Определим тип для данных эффекта
export interface EffectData {
  type: string;
  x: number;
  y: number;
  size?: number;
  intensity?: number;
  color?: number;
}

// Тип для функции-обработчика
type EffectHandler = (system: EffectSystem, data: EffectData) => void;

// Карта обработчиков, которую легко расширять
export const effectHandlers: Record<string, EffectHandler> = {
  explosion: (system, data) => system.triggerExplosion(data.x, data.y, data.size),
  debris: (system, data) => system.triggerDebris(data.x, data.y, data.size),
  sparks: (system, data) => system.triggerSparks(data.x, data.y, data.intensity),
  dust: (system, data) => system.triggerDust(data.x, data.y, data.intensity),
  mining: (system, data) => system.triggerMiningEffect(data.x, data.y, data.intensity),
  glow: (system, data) => system.triggerResourceGlow(data.x, data.y, data.color ?? 0xFFFFFF, data.size),
};
