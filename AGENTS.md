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

### Don't
- Do not hardcode colors — use Tailwind neon theme variables from theme.css
- Do not use divs if a component exists — check `src/ui/base/`
- Do not add new heavy dependencies without approval
- Do not break the GameObject-Component architecture — keep components focused, systems for global processes
- Do not mix game logic with UI logic — use Nanostores as the bridge
- Do not create direct communication between PixiJS game world and Svelte UI
- Do not hardcode game balance values — use Config.ts for all parameters
- Do not use direct Pixi scene access from Svelte — only via Nanostores

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
- `src/main.ts` — app initialization and HMR
- `src/App.svelte` — main UI entry point
- `src/ui/` — Svelte UI components, `base/` for reusable ones
- `src/game/` — game logic: `components/`, `systems/`, `scenes/`, `prefabs/`
- `src/stores/` — Nanostores: `game/` for state, `ui/` for layout
- `src/engine/` — core: managers, scenes, ECS, events, render
- `src/generated/` — auto-generated from configs
- `src/assets/svg-primitives/` — vector icons

### Architecture Patterns
- **GameObject-Component**: GameObjects are containers, Components contain data + logic, Systems handle global processes
- **Reactive State**: Nanostores `map()` for complex objects, `atom()` for primitives
- **Three Layers**: PixiJS (rendering) ↔ Nanostores (state) ↔ Svelte (UI)
- **Configuration**: All game data centralized in `src/stores/game/Config.ts` — no hardcoded values
- **Event Bus**: Cross-layer communication via `src/engine/events/EventBus.ts`
- **Layout Engine**: `src/engine/render/LayoutEngine.ts` for safe area and scaling
- **Panel Positioning**: `panelPositioningService` for UI panel management

### Good and Bad Examples
- Good: `src/stores/game/state.ts` — reactive stores with clear actions
- Good: `src/game/systems/` — global system logic
- Good: `src/ui/base/Button.svelte` — reusable base component
- Good: `src/stores/game/Config.ts` — centralized game balance configuration
- Good: `src/engine/logging` — proper logging instead of console.log
- Good: `panelPositioningService.registerPanel()` — proper panel management
- Avoid: mixing PixiJS rendering with Svelte state updates
- Avoid: hardcoded game values — use Config.ts instead
- Avoid: class-based Svelte components — use functional Svelte components
- Avoid: magic numbers in systems — extract to Config.ts
- Avoid: direct Pixi scene access from Svelte — use Nanostores
- Avoid: `../..` imports — use `@/` aliases instead

### Game Development Patterns
- **Systems**: Global processes that operate on multiple GameObjects
- **Components**: Contain data and logic, attached to GameObjects
- **GameObjects**: Containers with unique IDs and component collections
- **Effects**: Use `src/game/effects/` for particle systems and visual effects
- **Factories**: Use `src/game/entities/` for creating game objects

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
- UI: responsive, follows neon theme
- Performance: 60 FPS on mobile, no memory leaks
- State: proper Nanostores usage, no direct PixiJS-UI communication

### When Stuck
- Check existing similar systems in `src/game/systems/`
- Look at base components in `src/ui/base/`
- Review Nanostores patterns in `src/stores/game/state.ts`
- Check engine components in `src/engine/components/`
- Review architecture in `docs/architecture.md`
