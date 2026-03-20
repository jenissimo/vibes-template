# CLAUDE.md — Vibes Template Engine

## Quick Reference

| What          | Value                                           |
|---------------|------------------------------------------------|
| Stack         | PixiJS 8 + Svelte 5 + Nanostores + Tailwind 4 |
| Runtime       | Bun                                            |
| Mobile        | Capacitor 7                                    |
| Architecture  | GameObject-Component (3-layer)                 |
| Language      | TypeScript (strict)                            |

### Commands
```bash
bun run dev          # dev server with HMR
bun run build        # typecheck + production build
bun run check        # svelte-check diagnostics
bun run cap:sync     # sync Capacitor
bun run cap:run      # run on device
```

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

### Don't
- No direct PixiJS ↔ Svelte communication (only via Nanostores)
- No `any` types — use proper interfaces
- No hardcoded colors — use Tailwind theme variables
- No heavy dependencies without approval
- No `console.log` — use structured logger
- No breaking GameObject-Component patterns

## Architecture (3 Layers)

```
View Layer:      PixiJS (canvas) + Svelte 5 (UI)
                        ↕ Nanostores + EventBus
Logic Layer:     GameObject-Component + Systems + Config
                        ↕ Adapters
Platform Layer:  Capacitor (haptics, prefs, status bar)
```

**Key constraints:**
- GameObjects own Components (data + logic). Systems handle cross-object processes.
- Scenes receive managers via `initialize(managers)` — no globals.
- `LayoutEngine` computes safe area; `CoordinateService` syncs world ↔ UI coords.
- `ServiceRegistry` is the lightweight DI container.

## File Conventions

| Path                    | Purpose                              |
|------------------------|--------------------------------------|
| `src/engine/`          | Core: managers, scenes, ECS, events  |
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
