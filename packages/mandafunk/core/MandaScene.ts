import {
  AdditiveBlending,
  type Blending,
  Color,
  Mesh,
  MeshBasicMaterial,
  NormalBlending,
  PlaneGeometry,
  Scene,
  LinearFilter,
  SubtractiveBlending,
  Texture,
  TextureLoader,
} from "three";
import {
  canvas2texture,
  canvasTexture,
} from "../tools/canvas2texture";
import { ConfigType } from "../config/types";
import { configDefault } from "../config/defaults";
import { deepClone } from "../tools/deepClone";
import type { BackgroundShader } from "../shaders/ShaderAbstract";
import { loadShader } from "../shaders/shaderLoader";
import { updateTexts } from "../fx/text";
import { updateImages } from "../fx/image";
import { StaticItems } from "./StaticItems";

/**
 * Manages the Three.js scene for the MandaFunk visualization engine.
 * Handles background images, GLSL shader backgrounds, and scene lifecycle.
 *
 * The scene can display:
 * - A solid background color
 * - A background image (with blur and brightness controls)
 * - A GLSL shader effect (loaded dynamically)
 * - Any combination of the above
 */
export class MandaScene {
  /** The underlying Three.js Scene instance. */
  scene: Scene;
  /** Background image element used for image-based backgrounds. */
  background: HTMLImageElement;
  /** Current configuration controlling scene appearance. */
  config: ConfigType;
  /** All active shader instances (multi-layer compositing). */
  shaders: BackgroundShader[];
  /** Z-position for each shader in the layer stack (parallel to shaders[]). */
  private layerShaderZ: number[] = [];
  /** Per-layer background meshes (color/image planes). Managed by loadShaderLayers. */
  private layerBgMeshes: Mesh[] = [];
  /** Reference to the StaticItems instance for shader audio data access. */
  staticItems: StaticItems | false;
  /** Whether the device is mobile (reduces brightness). Defaults to false. */
  isMobile: boolean;

  constructor() {
    this.scene = new Scene();
    this.config = deepClone(configDefault);
    this.background = new Image();
    this.shaders = [];
    this.staticItems = false;
    this.isMobile = false;
  }

  /** Backward-compat accessor: returns the primary (first) shader or false. */
  get shader(): BackgroundShader | false {
    return this.shaders[0] || false;
  }

  /**
   * Sets the mobile device flag. When true, brightness is reduced by 50%.
   * @param mobile - Whether the current device is mobile
   */
  setMobile(mobile: boolean) {
    this.isMobile = mobile;
  }

  /**
   * Assigns the StaticItems instance for shader audio data integration.
   * @param staticItems - The StaticItems instance containing audio visualizations
   */
  setStatic(staticItems: StaticItems) {
    this.staticItems = staticItems;
  }

  /**
   * Returns the underlying Three.js Scene.
   * @returns The Scene instance
   */
  getScene(): Scene {
    return this.scene;
  }

  /**
   * Handles background image load completion.
   * Creates a canvas texture from the loaded image, applying blur and brightness filters,
   * and sets it as the scene background with correct aspect ratio.
   */
  /** Dispose the current background texture (if any) to free GPU memory. */
  private disposeBackgroundTexture() {
    if (this.scene.background && this.scene.background instanceof Texture) {
      this.scene.background.dispose();
    }
  }

  onLoad() {
    this.disposeBackgroundTexture();
    const bgFit = this.config.scene.bgFit ?? "cover";
    const blur = this.config.scene.blur || 0;
    let brightness: number = this.config.scene.brightness || 100;
    if (this.isMobile) {
      brightness /= 2;
    }
    const filter = `blur(${blur}px) brightness(${brightness}%)`;

    if (bgFit === "contain") {
      // Contain: show entire image, letterboxed with black bars
      const targetW = window.innerWidth;
      const targetH = window.innerHeight;
      const imgAspect = this.background.width / this.background.height;
      const targetAspect = targetW / targetH;

      let drawW: number, drawH: number, drawX: number, drawY: number;
      if (imgAspect > targetAspect) {
        drawW = targetW;
        drawH = targetW / imgAspect;
        drawX = 0;
        drawY = (targetH - drawH) / 2;
      } else {
        drawH = targetH;
        drawW = targetH * imgAspect;
        drawX = (targetW - drawW) / 2;
        drawY = 0;
      }

      const texture: canvas2texture = canvasTexture(targetW, targetH);
      const context = texture.context;
      if (context) {
        context.fillStyle = "#000000";
        context.fillRect(0, 0, targetW, targetH);
        context.filter = filter;
        context.drawImage(this.background, drawX, drawY, drawW, drawH);
      }
      texture.texture.minFilter = LinearFilter;
      this.scene.background = texture.texture;
      this.scene.background.offset.set(0, 0);
      this.scene.background.repeat.set(1, 1);
    } else {
      // Cover or Fit: draw at image dimensions, use UV offset/repeat
      const texture: canvas2texture = canvasTexture(
        this.background.width,
        this.background.height
      );
      const context = texture.context;
      if (context) {
        context.filter = filter;
        context.drawImage(
          this.background,
          0,
          0,
          this.background.width,
          this.background.height
        );
      }
      texture.texture.minFilter = LinearFilter;
      this.scene.background = texture.texture;

      if (bgFit === "cover") {
        const targetAspect = window.innerWidth / window.innerHeight;
        const imageAspect = this.background.width / this.background.height;
        const factor = imageAspect / targetAspect;
        this.scene.background.offset.x = factor > 1 ? (1 - 1 / factor) / 2 : 0;
        this.scene.background.repeat.x = factor > 1 ? 1 / factor : 1;
        this.scene.background.offset.y = factor > 1 ? 0 : (1 - factor) / 2;
        this.scene.background.repeat.y = factor > 1 ? 1 : factor;
      } else {
        // Fit: stretch to fill the entire screen
        this.scene.background.offset.set(0, 0);
        this.scene.background.repeat.set(1, 1);
      }
    }
  }

  /**
   * Updates the scene background based on the provided configuration.
   * Loads shader backgrounds and/or image backgrounds as configured.
   *
   * @param config - The new configuration to apply
   */
  async updateSceneBackground(config: ConfigType) {
    this.config = config;
    await this.addShaderBackground();
    if (config.scene.bgColor) {
      this.scene.background = new Color(config.scene.bgColor);
    }

    if (config.scene.background) {
      await new Promise<void>((resolve) => {
        this.background = new Image();
        this.background.onload = () => {
          this.onLoad();
          resolve();
        };
        this.background.onerror = () => resolve();
        this.background.src = config.scene.background;
      });
    }
  }

  /**
   * Loads and initializes the GLSL shader background from the configuration.
   * Clears any previously active shader before loading the new one.
   *
   * @returns false if no shader is configured or loading failed
   */
  async addShaderBackground() {
    this.scene.background = null;
    this.clearAllLayers();
    if (!this.config.scene.shader || this.config.scene.shader === "" || this.config.scene.shader_show === false) {
      return false;
    }

    try {
      const shader = await loadShader(this.config.scene.shader);
      await shader.init(this.config, this.scene, this.staticItems as StaticItems);
      this.shaders = [shader];
    } catch (error) {
      console.error(
        `Failed to load shader: ${this.config.scene.shader}`,
        error
      );
      return false;
    }
  }

  /**
   * Load multiple layers for compositing.
   * Each config contributes a background (color/image mesh) + shader.
   * configs[0] = highest priority (S1, closest to camera).
   * Layers are stacked back-to-front: last layer renders first, S1 on top.
   */
  async loadShaderLayers(configs: ConfigType[]): Promise<void> {
    this.scene.background = null;
    this.clearAllLayers();

    const loaded: BackgroundShader[] = [];
    const zPositions: number[] = [];
    const n = configs.length;

    for (let i = 0; i < n; i++) {
      const cfg = configs[i];
      // renderOrder controls draw order: bottom layer (last index) draws first,
      // top layer (index 0 = S1) draws last and appears on top.
      // Within a layer: bg draws before shader.
      const layerOrder = (n - 1 - i) * 2;
      const layerZ = -500;

      // --- Background mesh (color or image) for this layer ---
      await this.createLayerBgMesh(cfg, layerZ, layerOrder);

      // --- Shader for this layer ---
      if (!cfg.scene.shader || cfg.scene.shader === "" || cfg.scene.shader_show === false) {
        continue;
      }
      try {
        const shader = await loadShader(cfg.scene.shader);
        await shader.init(cfg, this.scene, this.staticItems as StaticItems);
        // Apply scene.opacity to per-shader transparency
        const sceneOpacity = cfg.scene.opacity ?? 1;
        shader.uniforms.iOpacity.value *= sceneOpacity;
        // Force render order: S1 on top
        shader.mesh.renderOrder = layerOrder + 1;
        shader.mesh.position.z = layerZ;
        // Disable depth so renderOrder alone controls compositing
        shader.shaderMaterial.depthTest = false;
        shader.shaderMaterial.depthWrite = false;
        loaded.push(shader);
        zPositions.push(layerZ);
      } catch (error) {
        console.error(`Failed to load shader layer: ${cfg.scene.shader}`, error);
      }
    }
    this.shaders = loaded;
    this.layerShaderZ = zPositions;
  }

  /**
   * Create a background mesh (color or image) for a single layer.
   * The mesh is a full-screen plane with opacity, positioned at bgZ.
   */
  private async createLayerBgMesh(cfg: ConfigType, bgZ: number, renderOrder: number): Promise<void> {
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (cfg.scene.background) {
      // Image background
      const opacity = cfg.scene.bg_opacity ?? 1;
      const blending = this.resolveBlending(cfg.scene.bg_blending);
      try {
        const texture = await new Promise<Texture>((resolve, reject) => {
          new TextureLoader().load(
            cfg.scene.background,
            (tex) => { tex.minFilter = LinearFilter; resolve(tex); },
            undefined,
            () => reject(new Error("Image load failed")),
          );
        });
        const geo = new PlaneGeometry(w, h);
        const mat = new MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity,
          blending,
          depthWrite: false,
          depthTest: false,
        });
        const mesh = new Mesh(geo, mat);
        (mesh as any).objType = "layerBg";
        mesh.renderOrder = renderOrder;
        mesh.position.z = bgZ;
        this.scene.add(mesh);
        this.layerBgMeshes.push(mesh);
      } catch {
        // Image failed to load — skip
      }
    } else if (cfg.scene.bgColor) {
      // Solid color background
      const opacity = cfg.scene.bgColor_opacity ?? 1;
      const blending = this.resolveBlending(cfg.scene.bgColor_blending);
      const geo = new PlaneGeometry(w, h);
      const mat = new MeshBasicMaterial({
        color: new Color(cfg.scene.bgColor),
        transparent: true,
        opacity,
        blending,
        depthWrite: false,
        depthTest: false,
      });
      const mesh = new Mesh(geo, mat);
      (mesh as any).objType = "layerBg";
      mesh.renderOrder = renderOrder;
      mesh.position.z = bgZ;
      this.scene.add(mesh);
      this.layerBgMeshes.push(mesh);
    }
  }

  /** Maps config blending string to Three.js blending constant. */
  private resolveBlending(mode?: string): Blending {
    switch (mode) {
      case "additive": return AdditiveBlending;
      case "subtractive": return SubtractiveBlending;
      default: return NormalBlending;
    }
  }

  /**
   * Lightweight config update for each shader layer without reloading.
   * Assumes the layer stack hasn't changed (same shaders in same order).
   */
  updateShaderLayers(configs: ConfigType[]): void {
    let shaderIdx = 0;
    let bgIdx = 0;
    for (const cfg of configs) {
      // Update background mesh opacity
      if ((cfg.scene.background || cfg.scene.bgColor) && bgIdx < this.layerBgMeshes.length) {
        const bgMesh = this.layerBgMeshes[bgIdx];
        const mat = bgMesh.material as MeshBasicMaterial;
        if (cfg.scene.background) {
          mat.opacity = cfg.scene.bg_opacity ?? 1;
          mat.blending = this.resolveBlending(cfg.scene.bg_blending);
        } else if (cfg.scene.bgColor) {
          mat.opacity = cfg.scene.bgColor_opacity ?? 1;
          mat.blending = this.resolveBlending(cfg.scene.bgColor_blending);
          mat.color.set(cfg.scene.bgColor);
        }
        // Keep transparent: true always — required for renderOrder compositing
        mat.transparent = true;
        bgIdx++;
      }

      // Update shader
      if (!cfg.scene.shader || cfg.scene.shader === "" || cfg.scene.shader_show === false) {
        continue;
      }
      if (shaderIdx < this.shaders.length) {
        this.shaders[shaderIdx].updateConfig(cfg);
        // Re-apply layer z-position (updateConfig resets mesh.position.z)
        this.shaders[shaderIdx].mesh.position.z = this.layerShaderZ[shaderIdx];
        // Apply scene.opacity as per-shader transparency (multiply with shader_opacity)
        const sceneOpacity = cfg.scene.opacity ?? 1;
        this.shaders[shaderIdx].uniforms.iOpacity.value *= sceneOpacity;
        shaderIdx++;
      }
    }
  }

  /** Clear all active shaders and layer background meshes from the scene. */
  private clearAllLayers(): void {
    for (const s of this.shaders) {
      s.clear();
    }
    this.shaders = [];
    this.layerShaderZ = [];
    for (const m of this.layerBgMeshes) {
      m.geometry?.dispose();
      (m.material as MeshBasicMaterial).map?.dispose();
      (m.material as MeshBasicMaterial).dispose();
      this.scene.remove(m);
    }
    this.layerBgMeshes = [];
  }

  /**
   * Propagates config changes to the active shader without reloading it.
   * Updates the shader's config reference so parameter changes (speed, opacity,
   * sin/cos) take effect on the next frame.
   */
  updateShaderConfig(config: ConfigType) {
    const prevBackground = this.config.scene.background;
    this.config = config;

    if (config.scene.background) {
      if (config.scene.background !== prevBackground) {
        // Background URL changed — load the new image
        this.background = new Image();
        this.background.onload = () => this.onLoad();
        this.background.src = config.scene.background;
      } else if (this.background && this.background.complete && this.background.naturalWidth > 0) {
        // Same URL, already loaded — reprocess (blur/brightness may have changed)
        this.onLoad();
      }
    } else if (config.scene.bgColor) {
      // Background color (visible behind shader when opacity < 1)
      this.scene.background = new Color(config.scene.bgColor);
    } else if (this.shaders.length === 0) {
      this.scene.background = null;
    }

    // Update the primary shader's config (single-scene path)
    const primary = this.shaders[0];
    if (primary && primary.updateConfig) {
      primary.updateConfig(config);
    }
  }

  /**
   * Updates the active shader's time uniform for animation.
   * @param time - Current animation time in seconds
   */
  updateShader(time: number) {
    for (const s of this.shaders) {
      if (s.uniforms) {
        s.update(time);
      }
    }
  }

  /**
   * Notifies the active shader that the viewport has been resized.
   * Updates resolution uniforms and repositions the shader mesh.
   */
  updateAfterResize() {
    for (const s of this.shaders) {
      s.updateResolution();
    }
  }

  /**
   * Removes all text and image overlay meshes from the scene.
   * Used during track transitions to clean up before loading new overlays.
   */
  clearScene() {
    const toRemove = this.scene.children.filter((child: any) => {
      const objType = child?.objType || "undefined";
      return objType === "text" || objType === "image";
    });
    for (const item of toRemove) {
      const mesh = item as any;
      mesh.geometry?.dispose();
      mesh.material?.map?.dispose();
      mesh.material?.dispose();
      this.scene.remove(item);
    }
  }

  /**
   * Fully disposes the scene: shader, background texture, and all child meshes.
   */
  dispose() {
    // Dispose all layers (shaders + background meshes)
    this.clearAllLayers();

    // Dispose background texture
    this.disposeBackgroundTexture();
    this.scene.background = null;

    // Remove and dispose all child meshes
    this.clearScene();
  }

  /**
   * Rebuilds text and image overlays from the current configuration.
   * Call this when texts or images are added/removed/changed.
   */
  updateTextsAndImages(config: ConfigType) {
    updateTexts(this.scene, config);
    updateImages(this.scene, config);
  }
}
