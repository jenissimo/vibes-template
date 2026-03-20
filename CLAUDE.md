# CLAUDE.md — Vibes Template Engine

## Quick Reference

| What          | Value                                           |
|---------------|------------------------------------------------|
| Stack         | PixiJS 8 + Svelte 5 + Nanostores + Tailwind 4 |
| Runtime       | Bun                                            |
| Mobile        | Capacitor 7                                    |
| Architecture  | GameObject-Component-System (3-layer)          |
| Language      | TypeScript (strict)                            |

### Commands
```bash
bun run dev          # dev server with HMR
bun run build        # typecheck + production build
bun run check        # svelte-check diagnostics
bun run cap:sync     # sync Capacitor
bun run cap:run      # run on device
```

---

## Engine Philosophy

### Thin entry, fat bootstrap
`main.ts` is a thin shell (~80 lines): Svelte mount, config, HMR handlers, DOMReady guard. All orchestration — init, service registration, teardown — lives in `GameBootstrap`. Never add logic to `main.ts`; extend `GameBootstrap` instead.

### Data flows down, events flow up
- **Down:** `Game` → `Scene.initialize(managers)` → `GameObject` → `Component`
- **Up:** `EventBus` for cross-system signals, Nanostores for PixiJS ↔ Svelte bridge
- Components never import scenes or Game directly — they receive what they need through `this.gameObject.scene` or `this.managers`.

### Explicit dependencies, minimal singletons
Three tiers of service access:

| Tier | Services | Access pattern |
|------|----------|----------------|
| **Keep singleton** | `eventBus`, `domEventBridge`, `logger` | Truly global, import directly |
| **ServiceRegistry** | `InputManager`, `CoordinateService`, `TextureFactory`, `DebugConsole` | `ServiceRegistry.get()` |
| **GameManagers** | `renderer`, `assets`, `input`, `effects`, `audio`, `coordinates`, `stage` | `this.managers.*` in scenes |

Prefer `this.managers.*` in scene/system code. Use `ServiceRegistry` when you don't have a managers reference. Avoid `getInstance()` in new code.

### Components declare their needs
Use `static requiredComponents` to declare sibling dependencies. `GameObject.add()` validates at add-time and throws a clear error if a required component is missing. This catches wiring bugs immediately, not on the next frame.

```ts
export class ClickComponent extends Component {
  static requiredComponents = [PixiSpriteRenderer];
  // ...
}
```

### Scenes own the spatial index
`Scene.componentIndex` (`ComponentIndex`) tracks which GameObjects have which component types — O(1) lookups. Use `scene.getObjectsWith(Type)` for hot-path queries (returns `ReadonlySet`), `findGameObjectsWithComponent(Type)` when you need an array. The index auto-updates on `scene.add/remove` and `gameObject.add/remove`.

### Containers resolve automatically
`PixiSpriteRenderer` (and subclasses like `SVGSpriteComponent`) no longer require an explicit container. Set `scene.defaultContainer` once in your scene setup, and renderers auto-resolve from it in `onAdded()`. Pass a container explicitly only when you need a non-default one.

```ts
// Scene setup — set once:
this.defaultContainer = this.gameC;

// Component creation — no container needed:
new PixiSpriteRenderer({ texture, anchor: { x: 0.5, y: 0.5 } })

// Explicit override when needed:
new PixiSpriteRenderer(specialContainer, { texture })
```

### Two kinds of systems
- **`System`** — bound to a `Scene`, destroyed on scene exit. Use for scene-specific processes (physics, background rendering).
- **`GlobalSystem`** — bound to `Game`, survives scene transitions. Use for cross-scene concerns (audio, analytics, achievements). Added via `game.addGlobalSystem()`, updated before scene in game loop.

### Pool, don't create
Use `PrefabPool` (`src/engine/prefabs/PrefabPool.ts`) for frequently spawned/destroyed objects. It handles pre-warming, get/release, auto scene.add, and timed release. Never manually manage object lifecycle for poolable entities.

---

## Rules

### Do
- Use `@/` aliases for imports (never `../..`)
- Use `logger` from `@/engine/logging` (never `console.log`)
- Use Nanostores as the **only** bridge between PixiJS and Svelte
- Use EventBus (`@/engine/events/EventBus`) for cross-system communication
- Use Config.ts for all game balance values — no magic numbers
- Use base components from `src/ui/base/` before creating new ones
- Use `panelPositioningService` for UI panel positioning
- Use Svelte 5 runes (`$props`, `$derived`) and callback props
- Use Tailwind 4 with theme colors from `src/styles/theme.css`
- Use TweenComponent for in-game animations, Motion One for UI
- Use `static requiredComponents` when a component depends on siblings
- Use `scene.getObjectsWith(Type)` for component queries in hot paths
- Use `scene.defaultContainer` instead of passing containers to every renderer
- Use `GameManagers` for service access in scenes/systems
- Use `PrefabPool` for frequently spawned objects
- Use `GlobalSystem` for logic that must survive scene transitions

### Don't
- No direct PixiJS ↔ Svelte communication (only via Nanostores)
- No `any` types — use proper interfaces
- No hardcoded colors — use Tailwind theme variables
- No heavy dependencies without approval
- No `console.log` — use structured logger
- No breaking GameObject-Component patterns
- No logic in `main.ts` — put it in `GameBootstrap`
- No new `getInstance()` singletons — use ServiceRegistry or GameManagers
- No linear scans for component queries — use ComponentIndex

## Architecture (3 Layers)

```
View Layer:      PixiJS (canvas) + Svelte 5 (UI)
                        ↕ Nanostores + EventBus
Logic Layer:     GameObject-Component + Systems + Config
                        ↕ Adapters
Platform Layer:  Capacitor (haptics, prefs, status bar)
```

### Initialization flow
```
main.ts
  └─ mount(App)
  └─ GameBootstrap.boot(config)
       ├─ initializeLogger + attachGlobalErrorHandlers
       ├─ PreGameLoader.load()
       ├─ resolveCanvas (with retry + app-ready wait)
       ├─ domEventBridge.initialize()
       ├─ settingsInitService.initialize()
       ├─ new Game(config, scene) → game.initialize()
       ├─ ServiceRegistry registrations
       ├─ GameAssetService → loadTextures
       ├─ game.startGame()
       └─ appMode scene switcher subscription
```

### Game loop order
```
Game.update(dt)
  ├─ inputManager.update(dt)
  ├─ effectSystem.update(dt)
  ├─ globalSystems[].update(dt)     ← cross-scene
  └─ sceneManager.update(dt)
       └─ scene.update(dt)
            ├─ preUpdateSteps
            ├─ systems[].update(dt)  ← scene-local
            ├─ gameObjects[].update(dt)
            │    └─ components[].update(dt)
            └─ postUpdateSteps
```

### Key constraints
- GameObjects own Components (data + logic). Systems handle cross-object processes.
- Scenes receive managers via `initialize(managers)` — no globals.
- `LayoutEngine` computes safe area; `CoordinateService` syncs world ↔ UI coords.
- `ServiceRegistry` is the lightweight DI container.
- `ComponentIndex` provides O(1) component queries per scene.
- `GameBootstrap` owns the full init/teardown lifecycle.

## File Conventions

| Path                    | Purpose                              |
|------------------------|--------------------------------------|
| `src/engine/`          | Core: managers, scenes, ECS, events  |
| `src/engine/GameBootstrap.ts` | Init/teardown orchestration    |
| `src/engine/scene/ComponentIndex.ts` | O(1) component query index |
| `src/engine/systems/GlobalSystem.ts` | Cross-scene system base    |
| `src/game/components/` | Game-specific components             |
| `src/game/systems/`    | Game-specific systems                |
| `src/game/scenes/`     | Scene compositions                   |
| `src/game/graphics/`   | Textures, filters, shaders           |
| `src/stores/game/`     | Nanostores for game state            |
| `src/stores/ui/`       | Nanostores for UI state              |
| `src/ui/`              | Svelte UI components                 |
| `src/ui/base/`         | Reusable base components             |
| `src/styles/theme.css` | Tailwind theme / design tokens       |
| `src/generated/`       | Auto-generated from configs          |
| `docs/architecture.md` | Full architecture documentation      |

## Safety

**Allowed without asking:**
- Read/search files, typecheck, build, edit existing files

**Ask first:**
- Package installs, git push, major refactoring
- Deleting files, changing core architecture
- Adding new major systems

## References
- [AGENTS.md](AGENTS.md) — detailed rules, patterns, examples
- [docs/architecture.md](docs/architecture.md) — full architecture overview
