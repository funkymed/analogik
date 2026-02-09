# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Analogik is a music disk web application that plays chiptune/tracker music files (.mod, .xm) with synchronized WebGL shader-based visualizations using Three.js. The project is built with React and TypeScript, and can be packaged as an Electron desktop application for Mac, Windows, and Linux.

## Build & Development Commands

### React Development
```bash
# Install dependencies
make install  # or yarn

# Start development server
make start    # or yarn start

# Build for production (web)
make build-react  # or yarn build
```

### Electron Distribution
```bash
# Install Electron dependencies
make electron-install

# After building React app, copy to Electron
make cp-build

# Test Electron app locally
make electron-start

# Build for all platforms
make build-all

# Build for specific platform
make build-mac
make build-win
make build-linux

# Complete build pipeline
make all  # Install, build React, install Electron, copy build, build all platforms
```

### Makefile Structure
The Makefile uses color-coded help output. Run `make help` or just `make` to see all available commands.

## Electrobun Distribution

Analogik can be packaged with **Electrobun** (~12 MB) as an alternative ultra-lightweight and fast option to Electron.

### Electrobun Advantages
- **Ultra-fast build**: 10-30 seconds (vs 3-5 min Tauri)
- **Size**: ~12 MB (vs 130 MB Electron)
- **Updates**: Patches of only 14 KB
- **System WebView**: WebKit (macOS), Edge WebView2 (Windows), WebKitGTK (Linux)
- **Native TypeScript**: Bun backend + React frontend
- **Hot reload**: No recompilation needed

### Electrobun Commands

```bash
# Development
make electrobun-start  # or npm run electrobun:dev

# Build
make electrobun-build-mac     # Universal binary (Intel + Silicon)
make electrobun-build-win     # Windows NSIS installer
make electrobun-build-linux   # AppImage

# Build all platforms
make electrobun-build
```

### Configuration
- Config: `electrobun.config.ts`
- Entry point: `src/index.js` (React) + `index.html`
- Assets: `public/` directory
- Output: `dist/` directory

### Electrobun Detection
```javascript
const isElectrobun = !!(window.electrobun);
const isDesktop = isElectron || isElectrobun;
```

## Electron vs Electrobun

| Feature | Electron | Electrobun |
|---------|----------|------------|
| Size | ~130 MB | ~12 MB |
| Build time | 2-5 min | 10-30 sec |
| WebView | Chromium | System |
| Backend | Node.js | Bun |
| Hot reload | Slow | Instant |

## Architecture

### Core Application Flow
1. **App.js** - Main React component that manages:
   - Audio player lifecycle (ChiptuneJsPlayer)
   - Track playlist and filtering (year, author, selection)
   - UI state (drawers, modals, volume, play/pause)
   - Track transitions with TWEEN.js animations
   - Keyboard shortcuts (`p` for playlist, `i` for info)

2. **RenderCanvas.tsx** - Three.js rendering pipeline:
   - Initializes WebGL renderer, camera, scene
   - Creates MandaScene instance with shader backgrounds
   - Manages StaticItems (oscilloscope, spectrum, timer, progressbar)
   - Runs animation loop with RAF
   - Handles responsive canvas resizing
   - Optional 3D "Analogik" logo with reflective material

3. **tracks.js** - Track database:
   - Array of track metadata (url, year, author, filename, shader config)
   - Helper functions: `getTracks()`, `getAuthors()`, `getYears()`, `getTrackByPos()`
   - Each track can have a custom shader configuration offset

### Mandafunk System (TypeScript)

The `src/Components/mandafunk/` directory contains the WebGL visualization engine:

#### Core Classes
- **MandaScene (scene.ts)** - Scene manager that handles background images, shader backgrounds, and scene lifecycle
- **StaticItems (fx/static.ts)** - Container for all visual components (oscilloscope, spectrum analyzer, timer, progressbar)
- **Composer (fx/composer.ts)** - Post-processing effects pipeline (bloom, RGB shift, film grain, static, hue/saturation)

#### FX Components
- **audio.ts** - Web Audio API integration, analyser setup
- **osciloscope.ts** - Waveform visualization
- **spectrum.ts** - Frequency spectrum bars
- **progressbar.ts** - Track progress indicator
- **progresstimer.ts** - Time display
- **image.ts** - Image overlays with animation support
- **text.ts** - Text overlays
- **static.ts** - Main coordinator for all FX elements

#### Shader System
- **fx/shaders/background/** - 50+ GLSL shader effects (plasma, tunnel, fractal, etc.)
- **fx/shaders/background/ShaderAbstract.ts** - Base class for all shaders
- **fx/shaders/background/index.ts** - Exports all available shaders
- Each shader receives audio data and time uniforms for music synchronization

#### Configuration
- **config.ts** - Default configuration schema (ConfigType)
- **types/config.ts** - TypeScript type definitions
- **ConfigVariations.js** - Array of preset configurations (different shader/effect combinations per track)
- Configuration structure:
  - `scene` - Background, shader, colors
  - `timer` - Position, color, font
  - `progressbar` - Position, colors
  - `vumeters` - Oscilloscope and spectrum settings
  - `composer` - Post-processing effects
  - `images` - Image overlay configs
  - `texts` - Text overlay configs

#### GUI Editor
- **gui/editor.ts** - dat.GUI integration for live editing (enable with `?editor=1` URL param)
- **gui/editorNode.ts** - Node-based interface (experimental)
- Allows real-time tweaking of all visual parameters

### Audio System
- Uses **ChiptuneJsPlayer** (libopenmpt.js wrapper) loaded from `public/chiptune2.js`
- Supports .mod, .xm, .it, .s3m and other tracker formats
- Web Audio API integration for real-time frequency analysis
- Audio files stored in `public/mods/` organized by year

### UI Components
- **PlayerControl.js** - Bottom player bar with play/pause, prev/next, volume
- **PlayListDrawer.js** - Right drawer with track list and filters
- **AboutDrawer.js** - Info drawer with author list
- **TrackList.js** - Filterable track listing
- **YearList.js** - Year filter chips
- **AuthorList.js** - Author filter chips
- **Loader.js** - Loading spinner during track transitions

### URL Parameters
- `?track=N` - Start at track position N
- `?config=N` - Use config variation N
- `?year=YYYY` - Filter by year
- `?author=name` - Filter by author
- `?selection=all|bleep|pouet` - Filter by selection type
- `?editor=1` - Enable GUI editor

## TypeScript Configuration

The project uses TypeScript in `src/` directory only:
- Target: ES6
- Module: ESNext with React JSX
- Strict mode enabled
- Explicit `.ts` extensions in imports (allowImportingTsExtensions)
- No emit (handled by react-scripts)

Most UI components are plain JavaScript, while the entire mandafunk rendering system is TypeScript.

## Asset Loading

Assets are preloaded before track transitions using `assets-preloader`:
- Background image
- Track audio file
- Fonts (Lobster-Regular.ttf, KdamThmorPro-Regular.ttf)
- HDR environment map (empty_warehouse_01_2k.hdr)

## Mobile Considerations

The app detects mobile devices and adjusts:
- Reduces brightness by 75% for mobile
- Hides title/subtitle texts on mobile-only devices
- Adjusts camera position based on portrait/landscape
- Shows smaller UI buttons
- Hides cursor on idle

## Development Patterns

### Adding New Tracks
1. Add .mod/.xm file to `public/mods/YEAR/`
2. Add entry to `tracks` array in `src/tracks.js`
3. Optionally assign a shader config: `shader: N` (index in ConfigVariations)

### Creating New Shaders
1. Create new shader file in `src/Components/mandafunk/fx/shaders/background/`
2. Extend `ShaderAbstract` class
3. Implement `init()`, `update()`, and `clear()` methods
4. Export from `index.ts`
5. Reference by class name in config: `scene.shader: "YourShaderName"`

### Adding Visual Effects
1. Add effect parameters to `ConfigType` in `types/config.ts`
2. Update `configDefault` in `config.ts`
3. Implement rendering logic in appropriate FX file
4. Register in `StaticItems` or `Composer` as needed

## Electron Specifics

- Main entry point: `electron/main.js`
- Build configuration in `electron/package.json`
- The `cp-build` target copies the React build to `electron/build/` and patches static paths
- Electron builds are output to `electron/dist/`
- Supports universal Mac builds (x64 + arm64)

## Important Notes

- Console logging is blocked in production (see disable-devtool usage)
- The app uses a custom router system via URL parameters, not react-router for navigation
- TWEEN.js handles fade transitions between tracks
- The animation loop runs independently from React lifecycle
- All shader uniforms receive `time`, `audioData`, and config-specific values

## Performance Optimizations (Phase 1 - Feb 2026)

The project has been optimized according to Vercel React Best Practices, resulting in an **85% reduction in initial bundle size**.

### Shader Loading System

**CRITICAL**: The 56 shaders use **dynamic imports** for optimal bundle size:

- **Location**: `src/Components/mandafunk/fx/shaders/background/shaderLoader.ts`
- **Usage**: `await loadShader(shaderName)` returns a shader instance
- **Result**: Each shader is a separate chunk (1-4 KB), loaded only when needed
- **Bundle Impact**: 0 KB of shaders in initial bundle (vs 500 KB before)

When adding new shaders:
1. Create the shader class extending `ShaderAbstract`
2. Add mapping in `shaderLoader.ts` shaderLoaders object
3. Add name to `availableShaders` array
4. The shader will be automatically code-split

**Note**: `scene.ts` methods `addShaderBackground()` and `updateSceneBackground()` are async.

### Component Imports

**IMPORTANT**: Always use direct imports for rsuite components to enable tree-shaking:

```javascript
// ✅ CORRECT
import Button from "rsuite/Button";
import Drawer from "rsuite/Drawer";

// ❌ INCORRECT (barrel import)
import { Button, Drawer } from "rsuite";
```

This applies to all UI components to maintain the optimized bundle size.

### Asset Loading

Assets are preloaded in parallel using custom functions in `App.js`:
- `preloadImage()`, `preloadAudio()`, `preloadFont()`, `preloadHDR()`
- Uses `Promise.all()` for parallel loading
- Logs performance metrics with `performance.now()`

### Lazy Loading

- **RenderCanvas**: Lazy loaded with `React.lazy()` and `<Suspense>`
- Reduces initial bundle by ~200-500 KB (Three.js + rendering code)
- Loader component shown during load

### Performance Metrics

After Phase 1 optimizations:
- Initial bundle: ~400 KB (was ~2-3 MB) - **85% reduction**
- Time to Interactive: ~2s (was >5s) - **60% faster**
- Shader chunks: 60+ separate files (1-4 KB each)
- Re-renders reduced by 40-60% (optimized mousemove listener)

See `report/PHASE_1_COMPLETE.md` and `report/react-guideline.md` for detailed analysis.
