# PixiJS v7 → v8 Migration Reference

## Breaking Changes Summary

### Initialization
```typescript
// v7: options in constructor
const app = new Application({ width: 800, height: 600 });

// v8: async init required (for WebGPU support)
const app = new Application();
await app.init({ width: 800, height: 600 });
```

### Package Structure
```typescript
// v7: separate packages
import { Application } from '@pixi/app';
import { Sprite } from '@pixi/sprite';

// v8: single unified package
import { Application, Sprite } from 'pixi.js';
```

## Complete API Changes Table

| v7 (removed/changed)              | v8 (use this)                                    |
|-----------------------------------|--------------------------------------------------|
| `new Application({ ... })`        | `new Application()` + `await app.init({...})`    |
| `app.view`                        | `app.canvas`                                     |
| `container.name`                  | `container.label`                                |
| `DisplayObject`                   | `Container` (base class now)                     |
| `interactive = true`              | `eventMode = 'static'`                           |
| `buttonMode = true`               | `cursor = 'pointer'`                             |
| `beginFill()` / `endFill()`       | `.rect().fill()` chainable API                   |
| `drawRect()`                      | `.rect()`                                        |
| `drawCircle()`                    | `.circle()`                                      |
| `drawEllipse()`                   | `.ellipse()`                                     |
| `drawPolygon()`                   | `.poly()`                                        |
| `drawRoundedRect()`               | `.roundRect()`                                   |
| `drawStar()`                      | `.star()`                                        |
| `lineStyle(width, color)`         | `.stroke({ width, color })`                      |
| `beginTextureFill()`              | `.fill(fillStyle)` with texture option            |
| `beginHole()` / `endHole()`       | `.circle().cut()` (shape + `.cut()`)             |
| `GraphicsGeometry`                | `GraphicsContext`                                 |
| `PIXI.Loader`                     | `PIXI.Assets.load()`                             |
| `PIXI.utils.TextureCache`         | `PIXI.Assets.get()`                              |
| `Texture.from(url)`               | `await Assets.load(url)` (must pre-load)         |
| `BaseTexture`                     | `TextureSource` (multiple types)                 |
| `cacheAsBitmap`                   | `cacheAsTexture()`                               |
| `updateTransform()`               | `onRender` callback                              |
| `Container.removeChildren(0)`     | `Container.removeChildren()` (no args)           |
| `NineSlicePlane`                  | `NineSliceSprite`                                |
| `SimpleMesh`                      | `MeshSimple`                                     |
| `SimplePlane`                     | `MeshPlane`                                      |
| `SimpleRope`                      | `MeshRope`                                       |
| `SCALE_MODES.NEAREST`             | `'nearest'` (string literal)                     |
| `WRAP_MODES.REPEAT`               | `'repeat'` (string literal)                      |
| `DRAW_MODES.POINTS`               | `'point-list'` (string literal)                  |
| `PIXI.settings.*`                 | `AbstractRenderer.defaultOptions` + `DOMAdapter`  |
| `PIXI.utils.*`                    | Direct top-level imports                          |
| `getBounds()` returns Rectangle   | `getBounds()` returns `Bounds`, use `.rectangle`  |
| `BaseTexture.mipmap`              | `source.autoGenerateMipmaps`                      |
| `TextFormat` (bitmap font)        | `bitmapFontTextParser`                            |
| `Application<HTMLCanvasElement>`   | `Application<Renderer<HTMLCanvasElement>>`         |

## Graphics API Migration

```typescript
// v7
const g = new Graphics();
g.beginFill(0xff0000, 0.8);
g.drawRect(0, 0, 100, 50);
g.endFill();
g.lineStyle(2, 0xffffff);
g.drawCircle(50, 25, 20);

// v8
const g = new Graphics()
  .rect(0, 0, 100, 50)
  .fill({ color: 0xff0000, alpha: 0.8 })
  .circle(50, 25, 20)
  .stroke({ color: 0xffffff, width: 2 });
```

## Texture Migration

```typescript
// v7: textures could load from URL
const sprite = Sprite.from('image.png'); // auto-loaded

// v8: must pre-load via Assets
const texture = await Assets.load('image.png');
const sprite = new Sprite(texture);
// Or with aliases:
Assets.add({ alias: 'hero', src: 'image.png' });
await Assets.load('hero');
```

## Filter Migration

```typescript
// v7
class MyFilter extends Filter {
  constructor() {
    super(vertexSrc, fragmentSrc, { uTime: 0 });
  }
}

// v8
class MyFilter extends Filter {
  constructor() {
    super({
      glProgram: GlProgram.from({ fragment: fragmentSrc, vertex: vertexSrc }),
      resources: {
        timeUniforms: { uTime: { value: 0.0, type: 'f32' } }
      }
    });
  }
}
// Community filters: '@pixi/filter-*' → 'pixi-filters/module-name'
```

## Ticker Migration

```typescript
// v7: callback receives delta
app.ticker.add((delta) => {
  bunny.rotation += delta;
});

// v8: callback receives Ticker instance
app.ticker.add((ticker) => {
  bunny.rotation += ticker.deltaTime;
  // or use ticker.deltaMS for milliseconds
});
```

## ParticleContainer Migration

```typescript
// v7: accepts Sprites as children
const particles = new ParticleContainer();
particles.addChild(sprite);

// v8: requires Particle class, not Sprites
const particles = new ParticleContainer({
  boundsArea: new Rectangle(0, 0, 500, 500) // required, no auto-bounds
});
const particle = new Particle(texture);
particles.addParticle(particle);    // not addChild
particles.removeParticle(particle); // not removeChild
// Access via particleChildren, not children
```

## Event System Migration

```typescript
// v7
sprite.interactive = true;
sprite.buttonMode = true;
sprite.on('click', handler);

// v8
sprite.eventMode = 'static';    // replaces interactive = true
sprite.cursor = 'pointer';      // replaces buttonMode = true
sprite.on('pointerdown', handler); // 'click' still works but pointer events preferred
// Default eventMode changed: 'auto' → 'passive'
```

## Culling Migration

```typescript
// v7: automatic culling
container.cullable = true;
// Happens automatically in render loop

// v8: manual culling required
container.cullable = true;
container.cullArea = new Rectangle(0, 0, 800, 600);
Culler.shared.cull(container, viewport);
// Or register CullerPlugin extension for automatic behavior
```

## Display Object Hierarchy

v7: `DisplayObject` → `Container` → Sprite/Graphics/Mesh (all can have children)

v8: `Container` is base class. **Leaf nodes (Sprite, Mesh, Graphics) cannot have children.**
If you need children on a sprite, wrap it in a Container.
