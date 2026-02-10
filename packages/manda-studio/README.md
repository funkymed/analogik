# MandaStudio

Visual scene editor for creating audio-reactive WebGL visualizations powered by the [mandafunk](../mandafunk/) rendering engine.

MandaStudio provides a desktop-class editing interface for designing, previewing, and exporting scene configurations used by the Analogik music disk application. It replaces the previous `dat.GUI`-based editor with a purpose-built React application.

## Features

- Real-time 3D preview with 56+ GLSL shader backgrounds
- Scene editor with shader browser, background color, brightness, and blur controls
- Post-processing effects pipeline: bloom, RGB shift, film grain, static noise, hue/saturation
- Audio visualization controls for oscilloscope and spectrum analyzer
- Text and image overlay management
- Preset library with IndexedDB persistence, search, tagging, and thumbnails
- Thumbnail capture from the live preview canvas
- Track timeline with drag-and-drop preset assignment
- Auto-assign presets to unassigned tracks
- Export configurations to JSON
- Import tracks and presets from JSON files
- Keyboard shortcuts for undo, redo, and playback control
- Undo/redo history (up to 50 snapshots)
- Dark theme UI built with Tailwind CSS and Radix primitives

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens a local Vite dev server with hot module replacement.

### Build

```bash
npm run build
```

Runs the TypeScript compiler followed by a Vite production build.

### Preview

```bash
npm run preview
```

Serves the production build locally for testing.

### Lint

```bash
npm run lint
```

## Architecture

```
src/
├── audio/            Audio engine (Web Audio API, analyser setup)
├── components/
│   ├── ui/           Shared UI primitives (sliders, toggles, color inputs, section headers)
│   ├── panels/       Editor panels (Scene, Vumeters, Composer, Texts, Images)
│   ├── library/      Preset library drawer with search, save, import/export
│   └── timeline/     Track timeline with drag-and-drop assignment
├── db/               IndexedDB persistence layer (Dexie.js)
├── hooks/            React hooks (audio, FPS, keyboard shortcuts, presets, thumbnails)
├── store/            Zustand state stores
│   ├── useStudioStore.ts    Main editor state: config, UI, undo/redo history
│   └── useTimelineStore.ts  Track list, assignments, filters, batch operations
├── timeline/         Timeline data types and import/export services
└── utils/            Utility functions (formatting, helpers)
```

### Application Layout

The editor is organized into three main areas:

1. **Left sidebar** -- Tabbed panel selector with five editor panels: Scene, Vumeters, Composer, Texts, and Images. Each panel exposes the relevant subset of the configuration as interactive controls.

2. **Center area** -- Live WebGL preview canvas powered by `MandaRenderer` from `@mandarine/mandafunk`. Below the preview sits an expandable track timeline and transport controls (play/pause, seek, volume).

3. **Library drawer** -- Slides in from the right. Stores scene presets in IndexedDB with thumbnails, tags, and search. Supports saving the current scene, importing/exporting preset collections as JSON, and loading presets back into the editor.

### State Management

All editor state flows through two Zustand stores:

- **useStudioStore** -- Holds the active `ConfigType` object, audio playback state, UI flags, and an undo/redo history stack. Config updates use dot-path notation (e.g., `"composer.bloom.strength"`) and deep-clone via `structuredClone` to avoid mutation.

- **useTimelineStore** -- Manages the track list, per-track preset assignments, year/author filters, and batch operations such as auto-assign and clear-all.

### Preset Persistence

Presets are stored in IndexedDB using Dexie.js. Each preset contains a full `ConfigType` snapshot, a base64 thumbnail captured from the canvas, optional tags, and timestamps. The library supports search, duplicate, delete, bulk import, and bulk export.

## Keyboard Shortcuts

| Shortcut                | Action             |
| ----------------------- | ------------------ |
| `Ctrl/Cmd + Z`          | Undo               |
| `Ctrl/Cmd + Shift + Z`  | Redo               |
| `Space`                  | Toggle play/pause  |

The `Space` shortcut is disabled when an input, textarea, or select element has focus.

## Tech Stack

| Technology      | Purpose                                      |
| --------------- | -------------------------------------------- |
| React 19        | UI framework                                 |
| TypeScript 5.9  | Type safety                                  |
| Vite 7          | Build tooling and dev server                 |
| Zustand 5       | State management                             |
| Radix UI        | Accessible primitives (select, slider, toggle, tooltip) |
| Tailwind CSS 4  | Utility-first styling                        |
| dnd-kit         | Drag-and-drop for timeline preset assignment |
| Dexie.js 4      | IndexedDB wrapper for preset persistence     |
| Three.js        | WebGL rendering (via mandafunk)              |
| react-colorful  | Color picker inputs                          |
| Lucide React    | Icon library                                 |

## Relationship with mandafunk

MandaStudio is a visual editor that sits on top of the `@mandarine/mandafunk` rendering engine. It does not contain any WebGL or shader code itself.

The mandafunk package provides:

- `MandaRenderer` -- the core renderer that manages a Three.js scene, shader backgrounds, post-processing pipeline, and audio-reactive visual elements.
- `ConfigType` and `configDefault` -- the configuration schema and default values that MandaStudio edits.
- `availableShaders` -- the list of 56+ GLSL shader names displayed in the shader browser.
- Shader loading, oscilloscope, spectrum analyzer, text/image overlays, and the composer effects chain.

MandaStudio imports these from `@mandafunk/*` path aliases and uses them to:

1. Initialize and drive the preview canvas via `MandaRenderer`.
2. Read and write `ConfigType` values through the editor panels.
3. List available shaders for the shader browser.
4. Export finished configurations for use in the Analogik player.

See the [`examples/`](./examples/) directory for standalone usage of mandafunk without MandaStudio.

## License

MIT
