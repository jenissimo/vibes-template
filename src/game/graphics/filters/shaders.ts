import * as PIXI from 'pixi.js';

/** Базовый вершинный шейдер, общий для всех фильтров */
export const BASIC_VERTEX_SHADER = `
  attribute vec2 aVertexPosition;
  attribute vec2 aTextureCoord;
  uniform mat3 projectionMatrix;
  varying vec2 vTextureCoord;
  void main(void) {
    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    vTextureCoord = aTextureCoord;
  }
`;

/** Хелперы */
export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
export const rgbFromHex = (hex: number): [number, number, number] => ([
  ((hex >> 16) & 0xff) / 255,
  ((hex >> 8)  & 0xff) / 255,
  ( hex        & 0xff) / 255,
]);

// Небольшая проверка, чтобы Pixi точно был связан (иногда трясёт типы при ESM)
export type PixiFilter = PIXI.Filter;
