/**
 * @module @mandarine/mandafunk/core/MandaRenderer
 *
 * Unified facade for the Mandafunk WebGL visualization engine.
 *
 * MandaRenderer encapsulates the full rendering pipeline: Three.js scene,
 * WebGL renderer, camera, post-processing composer, audio-reactive static
 * items (oscilloscope, spectrum, timer, progress bar), and GLSL shader
 * backgrounds. It provides a clean, lifecycle-aware API for integration
 * into any web application.
 *
 * @example
 * ```typescript
 * import { MandaRenderer } from "@mandarine/mandafunk";
 * import { createConfig } from "@mandarine/mandafunk/config";
 *
 * const canvas = document.getElementById("canvas") as HTMLCanvasElement;
 * const audioCtx = new AudioContext();
 * const analyser = audioCtx.createAnalyser();
 *
 * const renderer = new MandaRenderer(canvas, audioCtx, analyser);
 * await renderer.init();
 * await renderer.loadConfig(createConfig({ scene: { shader: "Plasma" } }));
 *
 * function loop(time: number) {
 *   renderer.render(time);
 *   requestAnimationFrame(loop);
 * }
 * requestAnimationFrame(loop);
 *
 * // On cleanup:
 * renderer.dispose();
 * ```
 */

import {
  PerspectiveCamera,
  WebGLRenderer,
} from "three";

import type { ConfigType } from "../config/types";
import { configDefault } from "../config/defaults";
import { mergeConfig } from "../config/merge";

// ---------------------------------------------------------------------------
// Core classes for the rendering pipeline.
// ---------------------------------------------------------------------------

import { MandaScene } from "./MandaScene";
import { Composer } from "./Composer";
import { StaticItems } from "./StaticItems";

// ---------------------------------------------------------------------------
// Renderer options
// ---------------------------------------------------------------------------

/**
 * Options for initializing the MandaRenderer.
 */
export interface MandaRendererOptions {
  /** WebGL antialias setting. Defaults to `true`. */
  antialias?: boolean;
  /** WebGL power preference. Defaults to `"high-performance"`. */
  powerPreference?: "high-performance" | "low-power" | "default";
  /** Device pixel ratio. Defaults to `window.devicePixelRatio`. */
  pixelRatio?: number;
  /** Initial camera field of view in degrees. Defaults to `60`. */
  fov?: number;
  /** Camera near clipping plane. Defaults to `0.1`. */
  near?: number;
  /** Camera far clipping plane. Defaults to `2000`. */
  far?: number;
  /** An optional player instance for progress / timer rendering. */
  player?: unknown;
}

// ---------------------------------------------------------------------------
// MandaRenderer
// ---------------------------------------------------------------------------

/**
 * Unified facade for the Mandafunk WebGL visualization engine.
 *
 * Manages the complete rendering lifecycle:
 * 1. Three.js WebGL renderer, perspective camera, and scene initialization.
 * 2. MandaScene for background images and GLSL shader management.
 * 3. StaticItems for audio-reactive visualizations (oscilloscope, spectrum,
 *    timer, progress bar).
 * 4. Composer for the post-processing effects pipeline (bloom, film grain,
 *    RGB shift, hue/saturation, etc.).
 *
 * The class is designed to be framework-agnostic. It accepts a raw
 * `HTMLCanvasElement` and Web Audio API nodes, making it usable with
 * React, Vue, Svelte, or vanilla JavaScript.
 */
export class MandaRenderer {
  // -----------------------------------------------------------------------
  // Private state
  // -----------------------------------------------------------------------

  /** The target canvas element. */
  private readonly canvas: HTMLCanvasElement;

  /** Web Audio API context for audio analysis. */
  private readonly audioContext: AudioContext;

  /** Web Audio API analyser node providing frequency/waveform data. */
  private analyser: AnalyserNode;

  /** Initialization options. */
  private readonly options: Required<
    Pick<MandaRendererOptions, "antialias" | "powerPreference" | "pixelRatio" | "fov" | "near" | "far">
  >;

  /** Three.js WebGL renderer instance. */
  private renderer: WebGLRenderer | null = null;

  /** Three.js perspective camera. */
  private camera: PerspectiveCamera | null = null;

  /** Scene manager for backgrounds and shaders. */
  private scene: MandaScene | null = null;

  /** Audio-reactive visualization items. */
  private staticItems: StaticItems | null = null;

  /** Post-processing effects pipeline. */
  private composer: Composer | null = null;

  /** Currently active configuration. */
  private config: ConfigType;

  /** Optional player instance for progress/timer. */
  private player: unknown = null;

  /** Whether the renderer has been initialized. */
  private initialized = false;

  /** Whether the renderer has been disposed. */
  private disposed = false;

  // -----------------------------------------------------------------------
  // Constructor
  // -----------------------------------------------------------------------

  /**
   * Creates a new MandaRenderer instance.
   *
   * Note: The renderer is not immediately active after construction.
   * Call {@link init} to set up the WebGL context and rendering pipeline,
   * then {@link loadConfig} to apply a visualization configuration.
   *
   * @param canvas - The HTML canvas element to render into.
   * @param audioContext - The Web Audio API context.
   * @param analyser - The Web Audio API analyser node connected to the audio source.
   * @param options - Optional initialization settings.
   */
  constructor(
    canvas: HTMLCanvasElement,
    audioContext: AudioContext,
    analyser: AnalyserNode,
    options: MandaRendererOptions = {},
  ) {
    this.canvas = canvas;
    this.audioContext = audioContext;
    this.analyser = analyser;
    this.config = structuredClone(configDefault);
    this.player = options.player ?? null;

    this.options = {
      antialias: options.antialias ?? true,
      powerPreference: options.powerPreference ?? "high-performance",
      pixelRatio: options.pixelRatio ?? (typeof window !== "undefined" ? window.devicePixelRatio : 1),
      fov: options.fov ?? 60,
      near: options.near ?? 0.1,
      far: options.far ?? 2000,
    };
  }

  // -----------------------------------------------------------------------
  // Initialization
  // -----------------------------------------------------------------------

  /**
   * Initializes the WebGL renderer, camera, scene, and all sub-systems.
   *
   * This method must be called once before any rendering can occur.
   * It creates the Three.js WebGLRenderer, PerspectiveCamera, MandaScene,
   * StaticItems, and Composer instances.
   *
   * @throws Error if the renderer has already been initialized or disposed.
   *
   * @example
   * ```typescript
   * const renderer = new MandaRenderer(canvas, audioCtx, analyser);
   * await renderer.init();
   * ```
   */
  async init(): Promise<void> {
    if (this.disposed) {
      throw new Error("MandaRenderer: cannot init after dispose()");
    }
    if (this.initialized) {
      throw new Error("MandaRenderer: already initialized");
    }

    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;

    // Camera
    this.camera = new PerspectiveCamera(
      this.options.fov,
      width / height,
      this.options.near,
      this.options.far,
    );
    this.camera.updateProjectionMatrix();
    this.camera.position.set(0, 0, 0);
    this.camera.layers.enable(1);

    // WebGL Renderer
    this.renderer = new WebGLRenderer({
      antialias: this.options.antialias,
      alpha: false,
      powerPreference: this.options.powerPreference,
      preserveDrawingBuffer: false,
      precision: "highp",
      canvas: this.canvas,
    });
    this.renderer.debug.checkShaderErrors = true;
    this.renderer.autoClear = false;
    this.renderer.autoClearColor = true;
    this.renderer.setPixelRatio(this.options.pixelRatio);
    this.renderer.setSize(width, height);

    // Scene manager
    this.scene = new MandaScene();
    this.staticItems = new StaticItems(
      this.config,
      this.player,
      this.audioContext,
      this.analyser,
      this.scene.getScene(),
    );
    this.scene.setStatic(this.staticItems);
    this.camera.lookAt(this.scene.getScene().position);

    this.composer = new Composer(
      this.renderer,
      this.scene,
      this.camera,
    );

    this.initialized = true;
  }

  // -----------------------------------------------------------------------
  // Configuration
  // -----------------------------------------------------------------------

  /**
   * Loads a complete configuration, updating all visual subsystems.
   *
   * This is the primary way to change the visualization. It updates
   * the scene background/shader, static items, images, texts, and
   * post-processing composer in one atomic operation.
   *
   * @param config - The complete configuration to apply.
   *
   * @example
   * ```typescript
   * import { createConfig } from "@mandarine/mandafunk/config";
   *
   * await renderer.loadConfig(createConfig({
   *   scene: { shader: "Tunnel", brightness: 60 },
   *   composer: { bloom: { strength: 1.0 } },
   * }));
   * ```
   */
  async loadConfig(config: ConfigType): Promise<void> {
    this.ensureInitialized();
    this.config = structuredClone(config);

    if (this.scene && this.staticItems && this.composer) {
      await this.scene.updateSceneBackground(this.config);
      this.scene.clearScene();
      this.scene.updateTextsAndImages(this.config);
      this.staticItems.update(this.config);
      this.composer.updateComposer(this.config);
    }
  }

  /**
   * Applies a partial configuration update by merging into the current config.
   *
   * Use this for incremental changes (e.g., adjusting a single effect
   * parameter) without replacing the entire configuration.
   *
   * @param partial - Partial configuration overrides to merge.
   *
   * @example
   * ```typescript
   * renderer.updateConfig({
   *   composer: { bloom: { strength: 0.5 } },
   * });
   * ```
   */
  updateConfig(partial: Partial<ConfigType>): void {
    this.ensureInitialized();
    this.config = mergeConfig(this.config, partial);

    if (this.scene) {
      this.scene.updateShaderConfig(this.config);
      this.scene.updateTextsAndImages(this.config);
    }
    if (this.staticItems) {
      this.staticItems.update(this.config);
    }
    if (this.composer) {
      this.composer.updateComposer(this.config);
    }
  }

  /**
   * Returns the currently active configuration.
   *
   * The returned object is a deep clone; mutations will not affect
   * the renderer state. Use {@link updateConfig} to apply changes.
   *
   * @returns A deep clone of the current configuration.
   */
  getCurrentConfig(): ConfigType {
    return structuredClone(this.config);
  }

  // -----------------------------------------------------------------------
  // Rendering
  // -----------------------------------------------------------------------

  /**
   * Executes a single render frame.
   *
   * Call this method inside a `requestAnimationFrame` loop to drive
   * the visualization. It updates all audio-reactive elements and
   * runs the post-processing pipeline.
   *
   * @param time - The current timeline time in seconds. All animations
   *               (shaders, post-processing) are driven by this value.
   *               When paused, pass the same time to freeze the visuals.
   *
   * @example
   * ```typescript
   * function animate(timestamp: number) {
   *   renderer.render(currentTime);
   *   requestAnimationFrame(animate);
   * }
   * requestAnimationFrame(animate);
   * ```
   */
  render(time: number): void {
    this.ensureInitialized();

    const t = time;

    // Update audio-reactive visualizations
    if (this.staticItems) {
      this.staticItems.rendering(t);
    }

    // Render the scene through the post-processing pipeline
    if (this.composer) {
      this.composer.rendering(t);
    }
  }

  /**
   * Clears the canvas to black without rendering the scene or composer.
   * Used when scene.show is false.
   */
  renderBlack(): void {
    if (this.renderer) {
      this.renderer.setClearColor(0x000000, 1);
      this.renderer.clear(true, true, true);
    }
  }

  // -----------------------------------------------------------------------
  // Resize
  // -----------------------------------------------------------------------

  /**
   * Updates the renderer and camera to match new viewport dimensions.
   *
   * Should be called whenever the canvas or window is resized.
   *
   * @param width - New viewport width in pixels.
   * @param height - New viewport height in pixels.
   *
   * @example
   * ```typescript
   * window.addEventListener("resize", () => {
   *   renderer.resize(window.innerWidth, window.innerHeight);
   * });
   * ```
   */
  resize(width: number, height: number): void {
    this.ensureInitialized();

    if (this.camera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }

    if (this.renderer) {
      this.renderer.setSize(width, height);
    }

    if (this.scene) {
      this.scene.updateAfterResize();
    }
  }

  // -----------------------------------------------------------------------
  // Audio
  // -----------------------------------------------------------------------

  /**
   * Updates the audio analyser node.
   *
   * Call this when the audio source changes (e.g., switching tracks)
   * and a new analyser node is connected.
   *
   * @param analyser - The new AnalyserNode to use for audio visualization.
   */
  setAnalyser(analyser: AnalyserNode): void {
    this.analyser = analyser;
    if (this.staticItems) {
      this.staticItems.setAnalyser(analyser);
    }
  }

  /**
   * Updates the player instance used for progress and timer rendering.
   *
   * @param player - The player instance providing `getPosition()`, `duration()`, etc.
   */
  setPlayer(player: unknown): void {
    this.player = player;
    if (this.staticItems) {
      this.staticItems.setPlayer(player);
    }
  }

  // -----------------------------------------------------------------------
  // Accessors
  // -----------------------------------------------------------------------

  /**
   * Returns the MandaScene instance.
   *
   * @returns The scene manager, or `null` if not yet initialized.
   */
  getScene(): MandaScene | null {
    return this.scene;
  }

  /**
   * Returns the Composer instance for the post-processing pipeline.
   *
   * @returns The composer, or `null` if not yet initialized.
   */
  getComposer(): Composer | null {
    return this.composer;
  }

  /**
   * Returns the StaticItems instance for audio visualizations.
   *
   * @returns The static items manager, or `null` if not yet initialized.
   */
  getStaticItems(): StaticItems | null {
    return this.staticItems;
  }

  /**
   * Returns the Three.js WebGLRenderer instance.
   *
   * @returns The WebGL renderer, or `null` if not yet initialized.
   */
  getRenderer(): WebGLRenderer | null {
    return this.renderer;
  }

  /**
   * Returns the Three.js PerspectiveCamera instance.
   *
   * @returns The camera, or `null` if not yet initialized.
   */
  getCamera(): PerspectiveCamera | null {
    return this.camera;
  }

  /**
   * Returns whether the renderer has been initialized.
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Returns whether the renderer has been disposed.
   */
  isDisposed(): boolean {
    return this.disposed;
  }

  // -----------------------------------------------------------------------
  // Disposal
  // -----------------------------------------------------------------------

  /**
   * Disposes all GPU resources and cleans up the rendering pipeline.
   *
   * After calling `dispose()`, the renderer instance cannot be reused.
   * Create a new `MandaRenderer` if you need to render again.
   *
   * This method is safe to call multiple times (subsequent calls are no-ops).
   *
   * @example
   * ```typescript
   * // In a React useEffect cleanup:
   * useEffect(() => {
   *   const renderer = new MandaRenderer(canvas, audioCtx, analyser);
   *   renderer.init();
   *   // ...
   *   return () => renderer.dispose();
   * }, []);
   * ```
   */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.initialized = false;

    // Dispose composer render targets and passes
    if (this.composer) {
      this.composer.dispose();
      this.composer = null;
    }

    // Dispose static items (textures, meshes, sparks)
    if (this.staticItems) {
      this.staticItems.dispose();
      this.staticItems = null;
    }

    // Clean up scene resources (shader, background texture, overlays)
    if (this.scene) {
      this.scene.dispose();
      this.scene = null;
    }

    // Dispose Three.js renderer (releases WebGL context)
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    this.camera = null;
    this.player = null;
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /**
   * Throws an error if the renderer has not been initialized or has been disposed.
   */
  private ensureInitialized(): void {
    if (this.disposed) {
      throw new Error("MandaRenderer: renderer has been disposed");
    }
    if (!this.initialized) {
      throw new Error("MandaRenderer: call init() before using the renderer");
    }
  }
}
