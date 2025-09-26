/**
 * Конфигурация шрифтов для игры
 * Определяет пути к шрифтам и их настройки
 */

export interface FontConfig {
  name: string;
  family: string;
  weights: number[];
}

export const FONT_CONFIGS: FontConfig[] = [
  {
    name: 'Orbitron',
    family: 'Orbitron',
    weights: [400, 700, 900],
  },
  {
    name: 'Exo2',
    family: 'Exo 2',
    weights: [400, 600, 700],
  },
  {
    name: 'Rajdhani',
    family: 'Rajdhani',
    weights: [400, 600, 700],
  }
];

export const FONT_FAMILIES = {
  mono: 'Orbitron, "Courier New", Consolas, monospace',
  sciFi: 'Exo 2, Orbitron, Arial, sans-serif',
  futuristic: 'Rajdhani, Exo 2, Arial, sans-serif'
} as const;

export type FontType = keyof typeof FONT_FAMILIES;
