# VIBES - Vaporwave Inspired Bitmap Engine Stack

<div align="center">
  <img src="vibes_logo.png" alt="VIBES" width="512" height="512" style="image-rendering: pixelated; image-rendering: -moz-crisp-edges; image-rendering: crisp-edges;">
</div>

## About

**VIBES** is a starter template for building cross-platform games. It's built on a tech stack focused on performance, modularity, and clean separation of concerns.

The project follows a three-layer architecture:
- **View Layer**: Rendering (PixiJS) and UI (Svelte 5).
- **State & Logic Layer**: State management (Nanostores) and game logic (GameObject-Component).
- **Platform Layer**: Native capabilities (Capacitor).

## Philosophy

- **Composition over inheritance**: `GameObject`s are assembled from independent components that hold data and logic.
- **Stores as the only bridge**: No direct calls between PixiJS and Svelte. All communication goes through Nanostores.
- **Configuration-driven**: All game balance values live in `src/stores/game/Config.ts`.
- **Small modules**: The project is made up of small, focused components, systems, and stores.
- **Two modes**: Game and scene editor.

## Tech Stack

- **Rendering**: [PixiJS 8](https://pixijs.com/)
- **UI**: [Svelte 5](https://svelte.dev/)
- **State management**: [Nanostores](https://github.com/nanostores/nanostores)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Motion One](https://motion.dev/)
- **Architecture**: Component-based (GameObject-Component)
- **Runtime**: [Bun](https://bun.sh/)
- **Mobile**: [Capacitor](https://capacitorjs.com/)

## Project Structure

```
.
├── docs/                 # Documentation
│   └── architecture.md   # Detailed architecture overview
├── src/
│   ├── engine/           # Game engine (core)
│   ├── game/             # Game logic (components, systems)
│   ├── stores/           # Nanostores (game and UI state)
│   ├── ui/               # Svelte UI components
│   ├── scene-editor/     # Scene editor
│   └── main.ts           # Application entry point
└── AGENTS.md             # AI assistant guidelines
```

## Quick Start

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/jenissimo/vibes-template
    ```

2.  **Install dependencies:**
    ```bash
    bun install
    ```

3.  **Start the dev server:**
    ```bash
    bun run dev
    ```

## Available Scripts

- `bun run dev`: start in development mode.
- `bun run build`: build for production.
- `bun run check`: TypeScript type checking.
- `bun run tsc --noEmit path/to/file.ts`: type check a specific file.

### Mobile Development

- `bun run cap:sync`: sync with Capacitor.
- `bun run cap:run`: run on a mobile device.

## Architecture

The core architectural principle is strict separation of concerns between layers.

1.  **View Layer (PixiJS & Svelte)**: Responsible solely for display. UI components subscribe to store changes and render current data. The game world is rendered via PixiJS.
2.  **State & Logic Layer**: The heart of the application.
    - **GameObject-Component**: Game objects (`GameObject`) are composed of components that hold data and logic. Systems handle global processes that span multiple objects.
    - **Nanostores**: Store global state (player profile, UI settings) and serve as the bridge between UI and game logic.
3.  **Platform Layer (Capacitor)**: Provides access to native APIs for mobile devices.

For a detailed architecture overview, see [`docs/architecture.md`](./docs/architecture.md).
