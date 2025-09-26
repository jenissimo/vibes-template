# AGENTS.md

### Do
- use Svelte 5 with runes and modern reactive patterns
- use Tailwind CSS 4 for all styling with neon theme colors from `src/styles/theme.css`
- use Motion One for animations - prefer hardware accelerated effects
- use Nanostores for state management - reactive stores with map/atom
- use PixiJS 8.13.2 for game rendering with custom GameObject-Component architecture
- use Bun for package management and script execution
- default to small, focused components following GameObject-Component principles
- use TypeScript with strict typing - no `any` types
- follow the three-layer architecture: View Layer (PixiJS + Svelte), State & Logic Layer (Nanostores + GameObject-Component), Platform Layer (Capacitor)
- use "@" aliases for imports instead of ".." from tsconfig.json
- use logger from `@/engine/logging` instead of console.log
- use callback props in Svelte instead of createEventDispatcher
- use TweenComponent for game animations
- use panelPositioningService for UI panels with proper registration/unregistration

### Don't
- do not hard code colors - use Tailwind neon theme variables from theme.css
- do not use divs if we have a component already - check `src/components/ui/base/`
- do not add new heavy dependencies without approval
- do not break the GameObject-Component architecture - keep components focused, systems for global processes
- do not mix game logic with UI logic - use Nanostores as the bridge
- do not create direct communication between PixiJS game world and Svelte UI
- do not hardcode game balance values - use Config.ts for all parameters
- do not use direct Pixi scene access from Svelte - only via Nanostores

### Commands
# file scoped checks preferred
bun run tsc --noEmit path/to/file.ts
bun run build
# development
bun run dev
# mobile testing
bun run cap:sync
bun run cap:run

### Safety and permissions

Allowed without prompt:
- read files, list files, search codebase
- TypeScript single file checks, build commands
- editing existing files following architecture patterns

Ask first: 
- package installs (especially heavy dependencies)
- git push, major refactoring
- deleting files, changing core architecture
- adding new major systems or breaking GameObject-Component patterns

### Project structure
- see `src/main.ts` for app initialization
- see `src/App.svelte` for main UI entry point
- components are in `src/ui/` with base components in `base/`
- game logic is in `src/game/` with components and systems in `components/` and `systems/`
- stores are in `src/stores/` - use Nanostores pattern
- assets are in `src/assets/svg-primitives/` for icons
- engine core is in `src/engine/` - managers, systems, components
- generated data is in `src/generated/` - auto-generated from configs

### Architecture patterns
- **GameObject-Component**: GameObject-Component architecture in `src/game/` - GameObjects are containers, components contain data and logic, systems handle global processes
- **Reactive State**: Use Nanostores `map()` for complex objects, `atom()` for primitives
- **Three Layers**: PixiJS (game rendering) ↔ Nanostores (state) ↔ Svelte (UI)
- **Configuration**: All game data centralized in `src/stores/game/Config.ts` - NO hardcoded values in systems
- **SVG Icons**: Use vector icons from `src/assets/svg-primitives/` with neon effects
- **Event Bus**: Use `src/engine/events/EventBus.ts` for cross-layer communication
- **Layout Engine**: Use `src/engine/render/LayoutEngine.ts` for safe area and scaling
- **Panel Positioning**: Use `panelPositioningService` for UI panel management

### Good and bad examples
- ✅ Good: `src/stores/game/state.ts` - reactive stores with clear actions
- ✅ Good: `src/game/systems/MiningSystem.ts` - global system logic
- ✅ Good: `src/ui/base/Button.svelte` - reusable base component
- ✅ Good: `src/stores/game/Config.ts` - centralized game balance configuration
- ✅ Good: `src/engine/logging` - proper logging instead of console.log
- ✅ Good: `panelPositioningService.registerPanel()` - proper panel management
- ❌ Avoid: mixing PixiJS rendering with Svelte state updates
- ❌ Avoid: hardcoded game values - use Config.ts instead
- ❌ Avoid: class-based components - use functional Svelte components
- ❌ Avoid: magic numbers in systems - extract to Config.ts
- ❌ Avoid: direct Pixi scene access from Svelte - use Nanostores
- ❌ Avoid: using ".." imports - use "@" aliases instead

### Game development patterns
- **Systems**: Global processes that operate on multiple GameObjects
- **Components**: Contain data and logic, attached to GameObjects
- **GameObjects**: Containers with unique IDs and component collections
- **Effects**: Use `src/game/effects/` for particle systems and visual effects
- **Factories**: Use `src/game/entities/` for creating game objects

### UI development patterns
- **Reactive**: Use `$:` for reactive statements, subscribe to Nanostores
- **Animations**: Use Motion One with `animate()` function for smooth effects
- **Styling**: Use Tailwind classes with neon theme colors from `src/styles/theme.css`
- **Components**: Extend from base components in `src/ui/base/`
- **Panels**: Use `panelPositioningService` with proper registration/unregistration
- **Callbacks**: Use callback props instead of createEventDispatcher
- **Hardware Acceleration**: Use `hardwareAccelerated: true` for Motion One animations

### API and data flow
- **State**: All game state lives in Nanostores (`src/stores/game/state.ts`)
- **Actions**: Use exported functions like `addCoins()`, `purchaseUpgrade()`
- **Persistence**: Auto-save handled by `PersistenceService.ts`
- **Configuration**: Game balance in `Config.ts` with upgrade costs and resource definitions
- **Event Bus**: Cross-layer communication via `src/engine/events/EventBus.ts`
- **Managers**: Access via `Game.getManagers()` - no global dependencies
- **Logging**: Use `logger` from `@/engine/logging` instead of console.log

### PR checklist
- TypeScript: no errors, proper typing
- GameObject-Component: components contain data and logic, systems handle global processes
- UI: responsive, follows neon theme
- Performance: 60 FPS on mobile, no memory leaks
- State: proper Nanostores usage, no direct PixiJS-UI communication

### When stuck
- Check existing similar systems in `src/game/systems/`
- Look at base components in `src/ui/base/`
- Review Nanostores patterns in `src/stores/game/state.ts`
- Check engine components in `src/engine/components/`
- Review architecture patterns in `docs/architecture.md`
- Ask for clarification on GameObject-Component architecture or state management

### Game balance and testing
- Use `src/ui/panels/TestPanel.svelte` for debugging
- Balance values in `src/stores/game/Config.ts`
- Test on mobile devices for performance
- Use safe zone testing in `src/utils/safeZoneTest.ts`
- Use `bun run build` for error checks
- Use `bun run tsc --noEmit path/to/file.ts` for file-specific checks

### Performance guidelines
- Use PIXI.Sprite pools for frequent object creation/destruction
- Limit particle effects on mobile devices
- Use `hardwareAccelerated: true` for Motion One animations
- Monitor FPS with performance tools
- Optimize SVG icons for mobile rendering
- Use TweenComponent for game animations
- Minimize allocations with object pools
- Use bundle splitting for heavy operations (`SharedSystems-*`)

### Mobile considerations
- Use Capacitor for native features (haptics, preferences)
- Test touch interactions thoroughly
- Optimize for battery life - avoid unnecessary animations
- Use safe area insets for modern mobile devices (`src/utils/safeZoneTest.ts`)
- Test on various screen sizes and orientations
- Use `panelPositioningService` for proper panel positioning
- Disable audio/effects on low-end devices via config

### Panel positioning example
```typescript
onMount(() => {
  if (panelElement) {
    panelPositioningService.registerPanel({
      id: "resource-panel",
      anchor: "TL",
      offsetX: 16, // 4 * 4px = 16px (top-4)
      offsetY: 0, // 4 * 4px = 16px (left-4)
      element: panelElement,
    });
  }
});

onDestroy(() => {
  panelPositioningService.unregisterPanel("resource-panel");
});
```
