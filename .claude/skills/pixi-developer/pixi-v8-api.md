# PixiJS 8 API Reference

## Application
```typescript
const app = new PIXI.Application();
await app.init({
  canvas: canvasElement,       // HTMLCanvasElement
  width: 800, height: 600,
  background: 0x0a0a0a,
  antialias: true,
  resolution: window.devicePixelRatio,
  autoDensity: true,
  resizeTo: window,
});
// Key properties
app.stage       // Root Container
app.canvas      // HTMLCanvasElement (was app.view in v7)
app.renderer    // Renderer instance
app.ticker      // Ticker instance
app.screen      // Rectangle { x, y, width, height }
```

## Container
Scene graph node. Base class for all display objects in v8 (DisplayObject removed).

```typescript
const container = new Container();
container.addChild(sprite);
container.removeChild(sprite);
container.getChildByLabel('name');       // was getChildByName
container.getChildrenByLabel(/pattern/); // regex support
container.reparentChild(child);          // preserves world transform
container.sortableChildren = true;       // enable zIndex sorting
container.isRenderGroup = true;          // optimize for UI layers
container.cacheAsTexture();              // was cacheAsBitmap
container.label = 'my-container';        // was .name
```

**Events:** `childAdded`, `childRemoved` signals.

**Leaf nodes** (Sprite, Mesh, Graphics) cannot contain children in v8.

## Sprite
```typescript
const texture = await Assets.load('path/to/image.png');
const sprite = new Sprite(texture);
sprite.anchor.set(0.5);
sprite.position.set(100, 100);
sprite.scale.set(2);
sprite.rotation = Math.PI / 4;
sprite.tint = 0xff0000;
sprite.alpha = 0.8;
// Events
sprite.eventMode = 'static';
sprite.cursor = 'pointer';
sprite.on('pointerdown', (e) => { ... });
```

### Sprite Variants
- `AnimatedSprite` — spritesheet animation
- `TilingSprite` — repeating texture
- `NineSliceSprite` (was `NineSlicePlane`) — 9-slice scaling

## Graphics
Chainable API — define shape, then apply fill/stroke:

```typescript
const g = new Graphics()
  // Basic shapes
  .rect(x, y, width, height)
  .circle(cx, cy, radius)
  .ellipse(cx, cy, radiusX, radiusY)
  .roundRect(x, y, w, h, radius)
  .poly([x1,y1, x2,y2, x3,y3])
  .star(cx, cy, points, radius, innerRadius)
  .arc(cx, cy, radius, startAngle, endAngle)
  // Lines
  .moveTo(x, y)
  .lineTo(x, y)
  .bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
  .quadraticCurveTo(cpx, cpy, x, y)
  // Styling (terminates current shape)
  .fill({ color: 0xff0000, alpha: 0.8 })
  .fill(0xff0000)  // shorthand
  .stroke({ color: 0xffffff, width: 2 })
  // Advanced shapes
  .chamferRect(x, y, w, h, chamfer)
  .filletRect(x, y, w, h, fillet)
  .regularPoly(cx, cy, radius, sides)
  .roundPoly(cx, cy, radius, sides, corner)
  .roundShape(points, radius);

// Holes: define hole shape then .cut()
g.rect(0, 0, 200, 200).fill(0x00ff00)
 .circle(100, 100, 40).cut();

// SVG paths
g.svg('<svg><path d="M 100 350 q 150 -300 300 0" /></svg>');
```

### GraphicsContext
Shared geometry data between Graphics instances:
```typescript
const context = new GraphicsContext()
  .circle(100, 100, 50)
  .fill('red');
const shapeA = new Graphics(context);
const shapeB = new Graphics(context); // shares same data
// Destroying context destroys all instances
shapeA.destroy({ context: true });
```

## Text
```typescript
const text = new Text({
  text: 'Hello World',
  style: {
    fontFamily: 'Arial',
    fontSize: 24,
    fill: 0xffffff,
    align: 'center',
  },
});
```

## Assets API
```typescript
// Single asset
const texture = await Assets.load('bunny.png');

// With alias
await Assets.load({ alias: 'bunny', src: 'path/to/bunny.png' });
const tex = Assets.get('bunny');

// Batch loading
const textures = await Assets.load(['bunny.png', 'cat.png']);

// Bundles
Assets.addBundle('game', {
  hero: 'assets/hero.png',
  bg: 'assets/bg.json',
});
const bundle = await Assets.loadBundle('game');

// Sprite sheets
const sheet = await Assets.load('spritesheet.json');
const heroTex = sheet.textures['hero.png'];

// Unload
await Assets.unload('bunny.png');

// Init with config
await Assets.init({
  basePath: '/assets/',
  defaultSearchParams: { v: '1.0' },
});
```

**Supported formats:** PNG, JPG, WebP, SVG, MP4, WebM, JSON sprite sheets, bitmap fonts, web fonts, compressed textures (Basis, KTX, DDS).

## Texture System
```typescript
// TextureSource types: ImageSource, CanvasSource, VideoSource, BufferImageSource, CompressedSource
const source = new ImageSource({ resource: myImage });
const texture = new Texture({ source });

// Properties
texture.source.scaleMode = 'linear';   // or 'nearest'
texture.source.wrapMode = 'repeat';    // or 'clamp-to-edge'
texture.source.autoGenerateMipmaps = true;

// Dynamic textures (runtime modification)
const dynTex = new Texture({ source, dynamic: true });
```

## Ticker
```typescript
// Callback receives Ticker instance (NOT delta directly like v7)
app.ticker.add((ticker) => {
  const dt = ticker.deltaTime;   // frame delta (1.0 = normal speed)
  const ms = ticker.deltaMS;     // milliseconds since last frame
  const fps = ticker.FPS;        // current FPS
});
app.ticker.maxFPS = 60;           // FPS cap (0 = uncapped)
app.ticker.speed = 1.0;           // time scale
```

## Events
```typescript
sprite.eventMode = 'static';   // Enable events
// Modes: 'none' | 'passive' | 'auto' | 'static' | 'dynamic'
// Default in v8: 'passive' (was 'auto' in v7)
sprite.cursor = 'pointer';
sprite.hitArea = new Rectangle(0, 0, 100, 100);

// FederatedPointerEvent
sprite.on('pointerdown', (e: FederatedPointerEvent) => {
  e.global;  // global position
  e.getLocalPosition(container); // local position
});
// Events: pointerdown, pointerup, pointermove, pointerover, pointerout, pointerenter, pointerleave
```

## Filters
```typescript
import { BlurFilter, ColorMatrixFilter, AlphaFilter, NoiseFilter } from 'pixi.js';

sprite.filters = [new BlurFilter({ strength: 4 })];

// Custom filter (v8)
const filter = new Filter({
  glProgram: GlProgram.from({ fragment: fragShader, vertex: vertShader }),
  resources: {
    timeUniforms: { uTime: { value: 0.0, type: 'f32' } }
  }
});
// Community filters: import from 'pixi-filters/module-name'
```

## Culling
```typescript
container.cullable = true;
container.cullArea = new Rectangle(0, 0, 800, 600);
container.cullableChildren = true;
// Manual cull (no longer automatic):
Culler.shared.cull(container, viewport);
// Or use CullerPlugin extension for automatic culling
```

## Uniforms (v8)
```typescript
const uniformGroup = new UniformGroup({
  uTime: { value: 1, type: 'f32' },
  uColor: { value: new Float32Array([1, 0, 0, 1]), type: 'vec4<f32>' },
});
// Textures are "resources", not uniforms in v8
```
