# @mandarine/mandafunk

WebGL visualization engine for audio-reactive scenes using Three.js and GLSL shaders.

Mandafunk provides a complete rendering pipeline for music-synchronized visual effects: 56 built-in GLSL shader backgrounds, real-time audio visualization (oscilloscope, spectrum analyzer), post-processing effects (bloom, film grain, RGB shift, and more), and overlay elements (timer, progress bar, images, text). Built on Three.js, it is framework-agnostic and integrates cleanly with React, Vue, Svelte, or vanilla JavaScript.

---

## Features

- **56 GLSL shader backgrounds** -- dynamically loaded on demand (zero initial bundle cost)
- **Audio-reactive visualizations** -- oscilloscope waveform and frequency spectrum analyzer driven by the Web Audio API
- **Post-processing pipeline** -- bloom, film grain, RGB shift, static noise, hue/saturation, lens distortion, and kaleidoscope effects
- **Overlay elements** -- configurable timer, progress bar, image planes, and text labels in 3D space
- **Type-safe configuration** -- full TypeScript types with validation, deep merge, and sensible defaults
- **Framework-agnostic** -- accepts a raw `HTMLCanvasElement` and Web Audio nodes; works anywhere
- **Lifecycle-aware** -- explicit `init()`, `dispose()`, and state guards prevent resource leaks
- **Particle sparks** -- optional particle system for ambient motion

---

## Installation

```bash
# npm
npm install @mandarine/mandafunk three

# yarn
yarn add @mandarine/mandafunk three

# pnpm
pnpm add @mandarine/mandafunk three
```

`three` (>= 0.150.0, < 1.0.0) is a required peer dependency.

---

## Quick Start

```typescript
import { MandaRenderer, createConfig } from "@mandarine/mandafunk";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();

// Connect your audio source to the analyser
// source.connect(analyser);
// analyser.connect(audioCtx.destination);

const renderer = new MandaRenderer(canvas, audioCtx, analyser);
await renderer.init();

const config = createConfig({
  scene: { shader: "Plasma", brightness: 80 },
  composer: { bloom: { strength: 1.0 } },
});
await renderer.loadConfig(config);

function animate() {
  requestAnimationFrame(animate);
  renderer.render();
}
animate();

// When done:
renderer.dispose();
```

---

## API Reference

### MandaRenderer

The main facade class that encapsulates the entire rendering pipeline.

```typescript
import { MandaRenderer } from "@mandarine/mandafunk";
```

#### Constructor

```typescript
new MandaRenderer(canvas, audioContext, analyser, options?)
```

| Parameter | Type | Description |
|---|---|---|
| `canvas` | `HTMLCanvasElement` | Target canvas element |
| `audioContext` | `AudioContext` | Web Audio API context |
| `analyser` | `AnalyserNode` | Analyser node connected to the audio source |
| `options` | `MandaRendererOptions` | Optional initialization settings |

**MandaRendererOptions:**

| Option | Type | Default | Description |
|---|---|---|---|
| `antialias` | `boolean` | `true` | WebGL antialiasing |
| `powerPreference` | `string` | `"high-performance"` | GPU power preference |
| `pixelRatio` | `number` | `window.devicePixelRatio` | Device pixel ratio |
| `fov` | `number` | `60` | Camera field of view (degrees) |
| `near` | `number` | `0.1` | Camera near clipping plane |
| `far` | `number` | `2000` | Camera far clipping plane |
| `player` | `unknown` | `null` | Player instance for progress/timer |

#### Methods

| Method | Signature | Description |
|---|---|---|
| `init()` | `async init(): Promise<void>` | Initializes the WebGL renderer, camera, scene, and all subsystems. Must be called once before rendering. Throws if already initialized or disposed. |
| `loadConfig()` | `async loadConfig(config: ConfigType): Promise<void>` | Loads a complete configuration, updating scene, shaders, static items, and composer. |
| `updateConfig()` | `updateConfig(partial: Partial<ConfigType>): void` | Applies a partial configuration update by deep-merging into the current config. Use for incremental changes. |
| `getCurrentConfig()` | `getCurrentConfig(): ConfigType` | Returns a deep clone of the current configuration. |
| `render()` | `render(time?: number): void` | Executes a single render frame. Call inside `requestAnimationFrame`. Uses the internal clock if `time` is omitted. |
| `resize()` | `resize(width: number, height: number): void` | Updates renderer and camera for new viewport dimensions. |
| `setAnalyser()` | `setAnalyser(analyser: AnalyserNode): void` | Replaces the audio analyser node (e.g., when switching tracks). |
| `setPlayer()` | `setPlayer(player: unknown): void` | Updates the player instance for progress/timer rendering. |
| `dispose()` | `dispose(): void` | Releases all GPU resources. The instance cannot be reused after disposal. Safe to call multiple times. |
| `isInitialized()` | `isInitialized(): boolean` | Returns `true` if `init()` has completed. |
| `isDisposed()` | `isDisposed(): boolean` | Returns `true` if `dispose()` has been called. |

#### Accessors

| Getter | Returns | Description |
|---|---|---|
| `getScene()` | `MandaScene \| null` | The scene manager |
| `getComposer()` | `Composer \| null` | The post-processing pipeline |
| `getStaticItems()` | `StaticItems \| null` | Audio visualization items |
| `getRenderer()` | `WebGLRenderer \| null` | Three.js WebGL renderer |
| `getCamera()` | `PerspectiveCamera \| null` | Three.js camera |
| `getClock()` | `Clock \| null` | Internal clock |

---

### ConfigType

The root configuration interface that controls all aspects of the visualization.

```typescript
import type { ConfigType } from "@mandarine/mandafunk";
```

| Property | Type | Description |
|---|---|---|
| `scene` | `SceneConfig` | Background, shader, and sparks settings |
| `music` | `string` | Music file URL or path |
| `timer` | `TimerConfig` | Timer display settings |
| `progressbar` | `ProgressBarConfig` | Progress bar settings |
| `vumeters` | `VuMetersConfig` | Oscilloscope and spectrum settings |
| `composer` | `ComposerType` | Post-processing effects pipeline |
| `images` | `Record<string, ImageType> \| ImageType[]` | Image overlay configurations (optional) |
| `texts` | `Record<string, TextType> \| TextType[]` | Text overlay configurations (optional) |

---

### configDefault

The default configuration providing sensible starting values for all properties.

```typescript
import { configDefault } from "@mandarine/mandafunk";
```

Key defaults include:
- No shader or background image (blank scene)
- White color scheme on dark background
- Bloom enabled (strength 0.85, threshold 0.73)
- Film grain enabled (scanlines 1000, noise 0.59)
- Oscilloscope and spectrum analyzer visible with motion blur
- Timer and progress bar positioned at the bottom of the viewport

---

### mergeConfig(base, partial)

Deep-merges a partial configuration into a base configuration, returning a new complete `ConfigType`. The base is cloned before merging -- it is never mutated.

```typescript
import { configDefault, mergeConfig } from "@mandarine/mandafunk";

const custom = mergeConfig(configDefault, {
  scene: { shader: "Tunnel", brightness: 60 },
  composer: { bloom: { strength: 1.0 } },
});
```

Merge rules:
- Primitive values in the partial overwrite values in the base.
- Nested objects are merged recursively.
- Arrays in the partial replace arrays in the base entirely.
- Properties not present in the partial are left unchanged.

---

### createConfig(partial)

Convenience wrapper that merges partial overrides into `configDefault`.

```typescript
import { createConfig } from "@mandarine/mandafunk";

const config = createConfig({
  scene: { shader: "Plasma", sparks: true },
  vumeters: { spectrum: { multiColor: true, bars: 64 } },
});
```

---

### validateConfig(config)

Validates a partial or complete configuration against range constraints derived from the GUI editor. Returns a `ValidationResult`.

```typescript
import { validateConfig } from "@mandarine/mandafunk";

const result = validateConfig({
  scene: { brightness: 300 },
});

if (!result.valid) {
  console.error(result.errors);
  // ["scene.brightness: value 300 is out of range [0, 200]"]
}
```

**ValidationResult:**

| Property | Type | Description |
|---|---|---|
| `valid` | `boolean` | `true` if there are no errors |
| `errors` | `string[]` | Array of human-readable error messages |

Checks performed:
- Numeric values fall within their defined ranges
- Color strings are valid hex colors (`#RGB`, `#RRGGBB`, `#RRGGBBAA`, or `0xRRGGBB`)
- Position coordinates (x, y, z) fall within scene bounds

---

### availableShaders

An array of all 56 built-in shader names.

```typescript
import { availableShaders } from "@mandarine/mandafunk";
console.log(availableShaders);
```

Complete list:

| | | | |
|---|---|---|---|
| Ball | Bubble | Cube | Cube2 |
| Cloud2 | Cloud3 | Combustible | Color |
| Color2 | Disco | Disco2 | Firestorm |
| Fractal | Fractal2 | Frequency | Galaxy |
| Hexa | Ice | Laser | Med1 |
| Med2 | Med3 | Med4 | NeonCircle |
| NeonVortext | NeonWave | Octo | Plasma |
| Plasma2 | Plasma3 | Pixelos | PolarViz |
| RadialFft | Space | Spectrum | Spiral |
| Starfield | Stellar | Strange | Texture |
| Texture2 | Texture3 | Tetris | Tube |
| Tunnel | Tunnel2 | Tunnel3 | Tunnel4 |
| TorusPiles | TorusFire | Tron | Twigl |
| Vortex | WaveLine | Worm | |

---

### loadShader(name)

Dynamically imports and instantiates a shader by name. Each shader is a separate chunk (1--4 KB), loaded only when needed.

```typescript
import { loadShader } from "@mandarine/mandafunk";

const shader = await loadShader("Plasma");
// shader implements BackgroundShader
```

Throws an error if the shader name is not found.

---

## Configuration Guide

### Scene

Controls the background and GLSL shader.

| Property | Type | Range | Default | Description |
|---|---|---|---|---|
| `bgColor` | `string` | Hex color | `""` | Solid background color |
| `background` | `string` | URL | `""` | Background image URL |
| `blur` | `number` | 0--200 | `0` | Background image blur (px) |
| `brightness` | `number` | 0--200 | `100` | Background brightness (%) |
| `shader` | `string` | Shader name | `""` | GLSL shader name |
| `shader_speed` | `number` | 0--10 | `1` | Shader animation speed |
| `shader_opacity` | `number` | 0--1 | `1.0` | Shader opacity |
| `shader_zoom` | `number` | 0--10 | -- | Shader zoom level |
| `shader_sin_cos_x` | `boolean` | -- | -- | Sin/cos modulation on X axis |
| `shader_sin_cos_y` | `boolean` | -- | -- | Sin/cos modulation on Y axis |
| `shader_sin_cos_speed` | `number` | 0--10 | -- | Sin/cos modulation speed |
| `shader_sin_cos_space` | `number` | 0--10 | -- | Sin/cos modulation amplitude |
| `sparks` | `boolean` | -- | -- | Enable particle spark effects |

### Post-Processing Effects (Composer)

Each effect has a `show` boolean to enable/disable it independently.

**Bloom:**

| Property | Type | Range | Default |
|---|---|---|---|
| `show` | `boolean` | -- | `true` |
| `strength` | `number` | 0--1 | `0.85` |
| `threshold` | `number` | 0--1 | `0.73` |
| `radius` | `number` | 0--10 | `0.3` |

**Film Grain:**

| Property | Type | Range | Default |
|---|---|---|---|
| `show` | `boolean` | -- | `true` |
| `count` | `number` | 0--1000 | `1000` |
| `sIntensity` | `number` | 0--3 | `0.22` |
| `nIntensity` | `number` | 0--3 | `0.59` |
| `grayscale` | `boolean` | -- | `false` |

**RGB Shift:**

| Property | Type | Range | Default |
|---|---|---|---|
| `show` | `boolean` | -- | `false` |
| `amount` | `number` | 0--1 | `0.005` |
| `angle` | `number` | 0--2 | `0.7` |

**Static Noise:**

| Property | Type | Range | Default |
|---|---|---|---|
| `show` | `boolean` | -- | `false` |
| `amount` | `number` | 0--1 | `0.2` |
| `size` | `number` | 0--256 | `2` |

**Hue/Saturation:**

| Property | Type | Range | Default |
|---|---|---|---|
| `show` | `boolean` | -- | `true` |
| `hue` | `number` | 0--1 | `0` |
| `saturation` | `number` | 0--1 | `0` |

**Lens Distortion** (optional):

| Property | Type | Range |
|---|---|---|
| `show` | `boolean` | -- |
| `strength` | `number` | 0--1 |
| `height` | `number` | -- |
| `cylindricalRatio` | `number` | 0.25--4 |

**Kaleidoscope** (optional):

| Property | Type | Range |
|---|---|---|
| `show` | `boolean` | -- |
| `sides` | `number` | -- |

### Audio Visualization (VU Meters)

**Oscilloscope** (`vumeters.oscilloscop`):

| Property | Type | Range | Default |
|---|---|---|---|
| `show` | `boolean` | -- | `true` |
| `color` | `string` | Hex color | `"#ffffff"` |
| `bgColor` | `boolean` | -- | `false` |
| `motionBlur` | `boolean` | -- | `true` |
| `motionBlurLength` | `number` | 0--1 | `0.25` |
| `opacity` | `number` | 0--1 | `1` |
| `width` | `number` | 0--1024 | `1024` |
| `height` | `number` | 0--1024 | `92` |
| `x`, `y`, `z` | `number` | -650 to 650 / -1 | `0, 0, -250` |

**Spectrum** (`vumeters.spectrum`):

| Property | Type | Range | Default |
|---|---|---|---|
| `show` | `boolean` | -- | `true` |
| `color` | `string` | Hex color | `"#ffffff"` |
| `multiColor` | `boolean` | -- | `true` |
| `centerSpectrum` | `boolean` | -- | `false` |
| `motionBlur` | `boolean` | -- | `true` |
| `motionBlurLength` | `number` | 0--1 | `0.25` |
| `bars` | `number` | 0--256 | `128` |
| `opacity` | `number` | 0--1 | `0.69` |
| `zoom` | `number` | 0--10 | `1` |

### Overlays

**Timer** (`timer`): Displays playback position and duration as text. Supports font, size, alignment, color, opacity, and 3D positioning.

**Progress Bar** (`progressbar`): Horizontal bar indicating playback progress. Supports fill color, cursor color, opacity, and 3D positioning.

**Images** (`images`): Record or array of `ImageType` objects. Each image is a textured plane in 3D space with position, rotation, zoom, opacity, and optional animation.

**Texts** (`texts`): Record or array of `TextType` objects. Each text element is drawn to a canvas texture and placed as a 3D plane with font, size, color, and positioning.

---

## Shader System

All shaders extend `ShaderAbstract`, which provides:

- A default vertex shader passing through UV coordinates and position
- Common fragment shader uniforms: `iTime`, `iOpacity`, `iResolution`, `iChannel0` (background texture), `iChannel1` (audio spectrum texture)
- Automatic mesh creation and scene attachment
- Time-based animation with optional sin/cos position modulation

### Creating a Custom Shader

```typescript
import { ShaderAbstract } from "@mandarine/mandafunk";

export class RedPulseShader extends ShaderAbstract {
  constructor() {
    super();
    this.fshader += `
      void main(void) {
        float pulse = 0.5 + 0.5 * sin(iTime * 3.0);
        vec2 uv = vUv;
        float dist = distance(uv, vec2(0.5));
        float intensity = smoothstep(0.5, 0.0, dist) * pulse;
        gl_FragColor = vec4(intensity, 0.0, 0.0, iOpacity);
      }
    `;
  }
}
```

**Available uniforms in fragment shaders:**

| Uniform | Type | Description |
|---|---|---|
| `iTime` | `float` | Elapsed time multiplied by `shader_speed` |
| `iOpacity` | `float` | Shader opacity from config |
| `iResolution` | `vec2` | Viewport width and height |
| `iChannel0` | `sampler2D` | Background image texture (if configured) |
| `iChannel1` | `sampler2D` | Audio spectrum texture from the analyser |

To register a custom shader for dynamic loading, add a mapping entry in `shaderLoader.ts` and include the name in `availableShaders`.

---

## Integration with React

```tsx
import { useRef, useEffect } from "react";
import { MandaRenderer, createConfig } from "@mandarine/mandafunk";

interface PreviewCanvasProps {
  shader: string;
  audioContext: AudioContext;
  analyser: AnalyserNode;
}

function PreviewCanvas({ shader, audioContext, analyser }: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<MandaRenderer | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new MandaRenderer(canvas, audioContext, analyser);
    rendererRef.current = renderer;
    let rafId: number;

    (async () => {
      await renderer.init();
      await renderer.loadConfig(
        createConfig({ scene: { shader, brightness: 80 } })
      );

      function animate() {
        rafId = requestAnimationFrame(animate);
        renderer.render();
      }
      animate();
    })();

    return () => {
      cancelAnimationFrame(rafId);
      renderer.dispose();
    };
  }, [shader, audioContext, analyser]);

  useEffect(() => {
    const handleResize = () => {
      const r = rendererRef.current;
      if (r?.isInitialized()) {
        r.resize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />;
}

export default PreviewCanvas;
```

---

## Integration with MandaStudio

MandaStudio is the companion visual editor built on top of this package. It provides a GUI for real-time editing of all configuration properties, shader selection, and preset management. The editor serializes its state as `ConfigType` objects, which can be loaded directly by `MandaRenderer.loadConfig()`.

---

## Browser Support

Mandafunk requires **WebGL 2.0** support. All modern browsers on desktop and mobile support WebGL 2:

| Browser | Minimum Version |
|---|---|
| Chrome | 56+ |
| Firefox | 51+ |
| Safari | 15+ |
| Edge | 79+ |

On mobile devices, brightness is automatically reduced and some position animations are disabled for performance.

---

## License

MIT
