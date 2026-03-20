# AGENTS.md

### Do
- Use Svelte 5 with runes and modern reactive patterns
- Use Tailwind CSS 4 for all styling with neon theme colors from `src/styles/theme.css`
- Use Motion One for UI animations — prefer hardware accelerated effects
- Use Nanostores for state management — reactive stores with map/atom
- Use PixiJS 8 for game rendering with custom GameObject-Component architecture
- Use Bun for package management and script execution
- Default to small, focused components following GameObject-Component principles
- Use TypeScript with strict typing — no `any` types
- Follow the three-layer architecture: View Layer (PixiJS + Svelte), State & Logic Layer (Nanostores + GameObject-Component), Platform Layer (Capacitor)
- Use `@/` aliases for imports (from tsconfig.json), never `../..`
- Use logger from `@/engine/logging` instead of console.log
- Use callback props in Svelte instead of createEventDispatcher
- Use TweenComponent for game animations
- Use panelPositioningService for UI panels with proper registration/unregistration
- Use EventBus for cross-system communication — components already implement IEventDispatcher
- Use `static requiredComponents` to declare component dependencies — validated at `GameObject.add()` time
- Use `scene.getObjectsWith(Type)` for O(1) component lookups, not manual filtering
- Use `scene.defaultContainer` — renderers auto-resolve container from scene, pass explicitly only for overrides
- Use `GameManagers` (`this.managers.*`) in scenes/systems instead of singletons
- Use `GlobalSystem` for cross-scene logic (audio, analytics, achievements)
- Use `PrefabPool` for frequently spawned/destroyed objects
- Put orchestration logic in `GameBootstrap`, not `main.ts`

### Don't
- Do not hardcode colors — use Tailwind neon theme variables from theme.css
- Do not use divs if a component exists — check `src/ui/base/`
- Do not add new heavy dependencies without approval
- Do not break the GameObject-Component architecture — keep components focused, systems for global processes
- Do not mix game logic with UI logic — use Nanostores as the bridge
- Do not create direct communication between PixiJS game world and Svelte UI
- Do not hardcode game balance values — use Config.ts for all parameters
- Do not use direct Pixi scene access from Svelte — only via Nanostores
- Do not add new `getInstance()` singletons — use ServiceRegistry or GameManagers
- Do not add logic to `main.ts` — extend `GameBootstrap` instead
- Do not linear-scan for component queries — use `ComponentIndex` via `scene.getObjectsWith()`

### Commands
```bash
# File-scoped checks preferred
bun run tsc --noEmit path/to/file.ts
bun run build

# Development
bun run dev

# Mobile testing
bun run cap:sync
bun run cap:run
```

### Safety and Permissions

**Allowed without prompt:**
- Read files, list files, search codebase
- TypeScript single file checks, build commands
- Editing existing files following architecture patterns

**Ask first:**
- Package installs (especially heavy dependencies)
- git push, major refactoring
- Deleting files, changing core architecture
- Adding new major systems or breaking GameObject-Component patterns

### Project Structure
- `src/main.ts` — thin entry: Svelte mount, config, HMR handlers, DOMReady guard
- `src/engine/GameBootstrap.ts` — full init/teardown orchestration
- `src/App.svelte` — main UI entry point
- `src/ui/` — Svelte UI components, `base/` for reusable ones
- `src/game/` — game logic: `components/`, `systems/`, `scenes/`, `prefabs/`
- `src/stores/` — Nanostores: `game/` for state, `ui/` for layout
- `src/engine/` — core: managers, scenes, ECS, events, render
- `src/engine/scene/ComponentIndex.ts` — O(1) component-type query index
- `src/engine/systems/GlobalSystem.ts` — base class for cross-scene systems
- `src/generated/` — auto-generated from configs
- `src/assets/svg-primitives/` — vector icons

### Architecture Patterns

- **GameObject-Component-System**: GameObjects are containers, Components contain data + logic, Systems handle cross-object processes
- **RequireComponent**: Components declare sibling dependencies via `static requiredComponents` — validated at add-time
- **ComponentIndex**: O(1) per-scene index mapping component types to GameObjects — use `scene.getObjectsWith(Type)`
- **Two system tiers**: `System` (scene-local, destroyed on exit) and `GlobalSystem` (game-level, survives transitions)
- **Auto-inject container**: `PixiSpriteRenderer` resolves container from `scene.defaultContainer` when none passed explicitly
- **Reactive State**: Nanostores `map()` for complex objects, `atom()` for primitives
- **Three Layers**: PixiJS (rendering) ↔ Nanostores (state) ↔ Svelte (UI)
- **Configuration**: All game data centralized in `src/stores/game/Config.ts` — no hardcoded values
- **Event Bus**: Cross-layer communication via `src/engine/events/EventBus.ts`
- **Layout Engine**: `src/engine/render/LayoutEngine.ts` for safe area and scaling
- **Panel Positioning**: `panelPositioningService` for UI panel management
- **Object Pooling**: `PrefabPool` with pre-warming, get/release, scheduled release

### Service Access Tiers

| Tier | Services | How to access |
|------|----------|---------------|
| Singleton (keep) | `eventBus`, `domEventBridge`, `logger` | Import directly |
| ServiceRegistry | `InputManager`, `CoordinateService`, `TextureFactory`, `DebugConsole` | `ServiceRegistry.get()` |
| GameManagers | `renderer`, `assets`, `input`, `effects`, `audio`, `coordinates`, `stage` | `this.managers.*` in scenes |

### Good and Bad Examples
- Good: `src/stores/game/state.ts` — reactive stores with clear actions
- Good: `src/game/systems/` — global system logic
- Good: `src/ui/base/Button.svelte` — reusable base component
- Good: `src/stores/game/Config.ts` — centralized game balance configuration
- Good: `src/engine/logging` — proper logging instead of console.log
- Good: `panelPositioningService.registerPanel()` — proper panel management
- Good: `ClickComponent.requiredComponents = [PixiSpriteRenderer]` — explicit dependencies
- Good: `scene.getObjectsWith(ClickComponent)` — O(1) query
- Good: `new PixiSpriteRenderer({ texture })` — container auto-resolved from scene
- Avoid: mixing PixiJS rendering with Svelte state updates
- Avoid: hardcoded game values — use Config.ts instead
- Avoid: class-based Svelte components — use functional Svelte components
- Avoid: magic numbers in systems — extract to Config.ts
- Avoid: direct Pixi scene access from Svelte — use Nanostores
- Avoid: `../..` imports — use `@/` aliases instead
- Avoid: new `getInstance()` singletons — use ServiceRegistry or GameManagers
- Avoid: adding orchestration logic to `main.ts` — use `GameBootstrap`

### Game Development Patterns
- **Systems**: Scene-local processes via `System`, cross-scene via `GlobalSystem`
- **Components**: Contain data and logic, attached to GameObjects. Use `static requiredComponents` for dependencies
- **GameObjects**: Containers with unique IDs and component collections
- **Effects**: Use `src/game/effects/` for particle systems and visual effects
- **Factories**: Use `src/game/entities/` for creating game objects
- **Pooling**: Use `PrefabPool` for frequently spawned objects with pre-warming

### UI Development Patterns
- **Reactive**: Subscribe to Nanostores with `$store`
- **Animations**: Motion One with `animate()` and `hardwareAccelerated: true`
- **Styling**: Tailwind classes with neon theme colors from `src/styles/theme.css`
- **Components**: Extend from base components in `src/ui/base/`
- **Panels**: Register in `panelPositioningService`, use `animations.panelSlideIn`
- **Callbacks**: Use callback props instead of createEventDispatcher

### Panel Positioning Example
```typescript
onMount(() => {
  if (panelElement) {
    panelPositioningService.registerPanel({
      id: "resource-panel",
      anchor: "TL",
      offsetX: 16,
      offsetY: 0,
      element: panelElement,
    });
  }
});

onDestroy(() => {
  panelPositioningService.unregisterPanel("resource-panel");
});
```

### Performance Guidelines
- Use PIXI.Sprite pools for frequent object creation/destruction
- Limit particle effects on mobile devices
- Use `hardwareAccelerated: true` for Motion One animations
- Minimize allocations with object pools (PrefabPool)
- Use `scene.getObjectsWith()` instead of `findGameObjectsWithComponent()` in hot paths
- Use bundle splitting for heavy operations (`SharedSystems-*`)

### Mobile Considerations
- Use Capacitor for native features (haptics, preferences)
- Test touch interactions thoroughly
- Use safe area insets for modern mobile devices
- Use `panelPositioningService` for proper panel positioning
- Disable audio/effects on low-end devices via config

### PR Checklist
- TypeScript: no errors, proper typing
- GameObject-Component: components contain data + logic, systems handle global processes
- RequireComponent: sibling dependencies declared via `static requiredComponents`
- UI: responsive, follows neon theme
- Performance: 60 FPS on mobile, no memory leaks
- State: proper Nanostores usage, no direct PixiJS-UI communication
- No new singletons: use ServiceRegistry or GameManagers

### When Stuck
- Check existing similar systems in `src/game/systems/`
- Look at base components in `src/ui/base/`
- Review Nanostores patterns in `src/stores/game/state.ts`
- Check engine components in `src/engine/components/`
- Review architecture in `docs/architecture.md`
- See `GameBootstrap` for init/teardown flow
