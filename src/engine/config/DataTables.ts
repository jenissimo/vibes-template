/**
 * Core Data Tables - базовые математические типы
 * Содержит только фундаментальные типы данных, которые можно переиспользовать в любых играх
 */

// Базовые математические типы
export interface Vector2 {
  x: number;
  y: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Range {
  min: number;
  max: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}
