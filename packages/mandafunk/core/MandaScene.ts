import { Color, Scene, LinearFilter } from "three";
import {
  canvas2texture,
  canvasTexture,
} from "../tools/canvas2texture";
import { ConfigType } from "../config/types";
import { configDefault } from "../config/defaults";
import { deepClone } from "../tools/deepClone";
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
  /** Active shader instance, or false if no shader is loaded. */
  shader: any;
  /** Reference to the StaticItems instance for shader audio data access. */
  staticItems: StaticItems | false;
  /** Whether the device is mobile (reduces brightness). Defaults to false. */
  isMobile: boolean;

  constructor() {
    this.scene = new Scene();
    this.config = deepClone(configDefault);
    this.background = new Image();
    this.shader = false;
    this.staticItems = false;
    this.isMobile = false;
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
  onLoad() {
    const texture: canvas2texture = canvasTexture(
      this.background.width,
      this.background.height
    );
    const context = texture.context;
    if (context) {
      const blur = this.config.scene.blur || 0;
      let brightness: number = this.config.scene.brightness || 100;
      if (this.isMobile) {
        brightness /= 2;
      }

      context.filter = `blur(${blur}px) brightness(${brightness}%)`;
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

    // Fix stretched background by adjusting UV offset/repeat
    const targetAspect = window.innerWidth / window.innerHeight;
    const imageAspect = 1920 / 1080;
    const factor = imageAspect / targetAspect;
    this.scene.background.offset.x = factor > 1 ? (1 - 1 / factor) / 2 : 0;
    this.scene.background.repeat.x = factor > 1 ? 1 / factor : 1;
    this.scene.background.offset.y = factor > 1 ? 0 : (1 - factor) / 2;
    this.scene.background.repeat.y = factor > 1 ? 1 : factor;
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
    if (this.shader) {
      this.shader.clear();
    }
    if (!this.config.scene.shader || this.config.scene.shader === "") {
      return false;
    }

    try {
      this.shader = await loadShader(this.config.scene.shader);
      await this.shader.init(this.config, this.scene, this.staticItems);
    } catch (error) {
      console.error(
        `Failed to load shader: ${this.config.scene.shader}`,
        error
      );
      return false;
    }
  }

  /**
   * Propagates config changes to the active shader without reloading it.
   * Updates the shader's config reference so parameter changes (speed, opacity,
   * sin/cos) take effect on the next frame.
   */
  updateShaderConfig(config: ConfigType) {
    this.config = config;

    // Reprocess background image if already loaded (apply blur/brightness changes)
    // Image takes priority over bgColor
    if (config.scene.background && this.background && this.background.complete) {
      this.onLoad();
    } else if (config.scene.bgColor) {
      // Background color (visible behind shader when opacity < 1)
      this.scene.background = new Color(config.scene.bgColor);
    } else if (!this.shader) {
      this.scene.background = null;
    }

    if (this.shader && this.shader.updateConfig) {
      this.shader.updateConfig(config);
    }
  }

  /**
   * Updates the active shader's time uniform for animation.
   * @param time - Current animation time in seconds
   */
  updateShader(time: number) {
    if (this.shader.uniforms) {
      this.shader.update(time);
    }
  }

  /**
   * Notifies the active shader that the viewport has been resized.
   * Updates resolution uniforms and repositions the shader mesh.
   */
  updateAfterResize() {
    if (this.shader) {
      this.shader.updateResolution();
    }
  }

  /**
   * Removes all text and image overlay meshes from the scene.
   * Used during track transitions to clean up before loading new overlays.
   */
  clearScene() {
    for (let mesh in this.scene.children) {
      const item: any = this.scene.children[mesh];
      const objType: string = item?.objType || "undefined";
      if (objType === "text" || objType === "image") {
        this.scene.remove(this.scene.children[mesh]);
      }
    }
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
