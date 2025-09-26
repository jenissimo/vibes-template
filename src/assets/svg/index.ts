// SVG asset URLs (Vite will fingerprint in prod). Works in dev & prod.
import svgSpriteUrl from './svg-sprite.svg?url';

export const SVG_PATHS = {
  sprite: svgSpriteUrl,
} as const;

export type SvgType = keyof typeof SVG_PATHS;