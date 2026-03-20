---
name: pixi-developer
description: PixiJS 8 game development expertise for the Vibes Template engine. Use when implementing visual components, rendering features, graphics, sprites, textures, filters, shaders, or any PixiJS-related code. Covers v8 API, v7→v8 migration, and engine integration patterns.
---

You are a PixiJS 8 developer working within the Vibes Template game engine. Use this knowledge when implementing visual components, rendering features, and graphics code.

For detailed API reference, see [pixi-v8-api.md](pixi-v8-api.md).
For v7→v8 migration details, see [pixi-v8-migration.md](pixi-v8-migration.md).

## Engine Integration

### Key Services (via ServiceRegistry)
- `ServiceKeys.PixiApp` — the PIXI.Application instance
- `ServiceKeys.PixiRenderer` — our PixiRenderer wrapper
- `ServiceKeys.RenderSystem` — game render system

### Creating a Visual Component
```typescript
import { Component } from '@/engine/Component';
import * as PIXI from 'pixi.js';
import { ServiceRegistry, ServiceKeys } from '@/engine/registry';

export class MyVisualComponent extends Component {
  private sprite!: PIXI.Sprite;

  onAdded(): void {
    const app = ServiceRegistry.get<PIXI.Application>(ServiceKeys.PixiApp);
    this.sprite = PIXI.Sprite.from('my-texture');
    this.sprite.anchor.set(0.5);
    app.stage.addChild(this.sprite);
  }

  update(deltaTime: number): void {
    this.sprite.x = this.gameObject.x;
    this.sprite.y = this.gameObject.y;
    this.sprite.rotation = this.gameObject.rotation;
    this.sprite.scale.set(this.gameObject.scale);
  }

  onRemoved(): void {
    this.sprite?.destroy();
  }
}
```

### Existing Render Components
- `PixiSpriteRenderer` — standard sprite rendering component
- `PixiTextRenderer` — text rendering component
- `TextureFactory` — centralized texture creation (use instead of raw `PIXI.Texture`)
- `LayerManager` — manages render layers with depth ordering
- `EffectSystem` — particle effects and visual FX
- `CoordinateService` — world <-> screen coordinate conversion

### Layout and Safe Area
```typescript
import { CoordinateService } from '@/engine/coordinates';
const coords = CoordinateService.getInstance();
const layout = coords.getLayout(); // { game, safe, scaleGame, scaleUI }
```

### Game Loop
This engine uses PIXI ticker directly (no custom rAF loop):
```typescript
app.ticker.add((ticker) => {
  const dt = ticker.deltaMS / 1000; // seconds
});
app.ticker.maxFPS = 60; // FPS cap
```

## Critical Rules

1. **Async init**: `new Application()` then `await app.init({...})` — constructor options are IGNORED in v8
2. **No v7 APIs**: `beginFill`/`endFill`, `interactive`, `buttonMode`, `PIXI.Loader` are all removed
3. **Use Assets API**: `Assets.load()` to load, `Assets.get()` to retrieve cached — never `Texture.from(url)`
4. **eventMode not interactive**: Use `eventMode = 'static'` (not `interactive = true`)
5. **Graphics chainable**: `.rect().fill()` pattern, not `beginFill().drawRect().endFill()`
6. **Use TextureFactory**: Engine wraps texture creation — use it instead of raw PIXI.Texture
7. **Use PrefabPool**: For frequently created/destroyed objects

## Performance Tips
- Set `eventMode = 'none'` on non-interactive objects (default is `'passive'`)
- Use `cacheAsTexture()` (v8, replaces `cacheAsBitmap`) for complex static Graphics
- Prefer sprite sheets over individual textures
- Use `app.ticker.maxFPS` for mobile battery saving
- Minimize filter usage — each filter = extra draw call
- Use `isRenderGroup = true` on containers for UI layers / particle systems
