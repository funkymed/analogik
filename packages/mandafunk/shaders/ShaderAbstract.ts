/**
 * @module @mandarine/mandafunk/shaders/ShaderAbstract
 *
 * Abstract base class for all background shaders in the Mandafunk visualization engine.
 * Each shader extends this class and provides custom fragment shader (GLSL) code.
 *
 * The shader system uses Three.js ShaderMaterial with custom uniforms for time,
 * resolution, opacity, and audio-reactive textures.
 */

import {
  AdditiveBlending,
  NormalBlending,
  SubtractiveBlending,
  Mesh,
  NearestFilter,
  PlaneGeometry,
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  TextureLoader,
  Vector2,
} from "three";
import type { ConfigType } from "../config/types";
import { configDefault } from "../config/defaults";
import { isMobile, isMobileOnly } from "react-device-detect";

/**
 * Interface for objects that provide a spectrum texture for audio visualization.
 * This is a minimal interface to decouple from the full StaticItems class.
 */
export interface TextureSpectrumProvider {
  textureSpectrum: {
    texture: THREE.Texture;
  };
}

/**
 * Interface that all background shaders must implement.
 */
export interface BackgroundShader {
  vshader: string;
  fshader: string;
  uniforms: Record<string, any>;
  shaderMaterial: ShaderMaterial;
  mesh: Mesh;
  init(config: ConfigType, scene: Scene, staticItems: TextureSpectrumProvider): Promise<void>;
  updateConfig(config: ConfigType): void;
  update(time: number): void;
  clear(): void;
  afterInit(): void;
}

/**
 * Abstract base class for background shaders.
 *
 * Provides default vertex shader, common uniform setup, texture loading,
 * and mesh creation. Subclasses typically only need to set `this.fshader`
 * in their constructor by appending fragment shader GLSL code.
 *
 * @example
 * ```typescript
 * export class MyShader extends ShaderAbstract {
 *   constructor() {
 *     super();
 *     this.fshader += `
 *       void main(void) {
 *         gl_FragColor = vec4(1.0, 0.0, 0.0, iOpacity);
 *       }
 *     `;
 *   }
 * }
 * ```
 */
export abstract class ShaderAbstract implements BackgroundShader {
  uniforms: Record<string, any>;
  vshader: string;
  fshader: string;
  shaderMaterial: ShaderMaterial;
  mesh: Mesh;
  scene: Scene;
  config: ConfigType;
  staticItems: TextureSpectrumProvider | false;

  constructor() {
    this.shaderMaterial = new ShaderMaterial();
    this.mesh = new Mesh();
    this.scene = new Scene();
    this.staticItems = false;
    this.vshader = `
        varying vec2 vUv;
        varying vec3 vPosition;
        void main( void ) {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
        `;
    this.fshader = `
        uniform float iTime;
        uniform float iOpacity;
        uniform vec2 iResolution;
        varying vec2 vUv;
        uniform sampler2D iChannel0;
        uniform sampler2D iChannel1;
        `;
    this.config = configDefault;
    this.uniforms = {
      iTime: { type: "f", value: 0.0 },
      iOpacity: { type: "f", value: 1.0 },
      diffuse: { type: "c", value: { r: 0, g: 1, b: 0 } },
      iChannel0: { type: "t", value: null },
      iChannel1: { type: "t", value: null },
      iChannel2: { type: "t", value: null },
      iResolution: { type: "v2", value: new Vector2() },
    };
  }

  /**
   * Initializes the shader with configuration, scene, and audio data.
   * Loads background texture if configured, sets up ShaderMaterial,
   * and adds the shader mesh to the scene.
   */
  async init(config: ConfigType, scene: Scene, staticItems: TextureSpectrumProvider): Promise<void> {
    this.config = config;
    this.scene = scene;
    this.staticItems = staticItems;

    if (config.scene.background) {
      const loader = new TextureLoader();
      await new Promise<void>((resolve) => {
        loader.load(
          this.config.scene.background,
          (background) => {
            background.minFilter = NearestFilter;
            background.magFilter = NearestFilter;
            background.wrapS = RepeatWrapping;
            background.wrapT = RepeatWrapping;
            this.uniforms.iChannel0.value = background;
            resolve();
          },
          undefined,
          () => resolve()
        );
      });
    }

    this.uniforms.iChannel1.value = staticItems.textureSpectrum.texture;

    this.uniforms.iOpacity.value = this.config.scene.shader_opacity || 1.0;
    this.updateResolution();

    const geometry = new PlaneGeometry(window.innerWidth, window.innerHeight);
    this.shaderMaterial = new ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: this.vshader,
      fragmentShader: this.fshader,
      transparent: true,
      blending: this.resolveBlending(config.scene.shader_blending),
    });

    this.mesh = new Mesh(geometry, this.shaderMaterial);
    this.mesh.position.z =
      (isMobile ? -0 : -500) * (config.scene.shader_zoom || 1);
    this.scene.add(this.mesh);
    this.afterInit();
  }

  /** Hook called after init completes. Override in subclasses for post-init setup. */
  afterInit() {}

  /** Removes the shader mesh from the scene. */
  clear() {
    this.scene.remove(this.mesh);
  }

  /** Updates resolution uniforms and mesh position based on window size. */
  updateResolution() {
    this.uniforms.iResolution.value.x = window.innerWidth;
    this.uniforms.iResolution.value.y = window.innerHeight;
    this.uniforms.iResolution.value.xy = window.innerWidth / window.innerHeight;
    this.mesh.position.z =
      (isMobile ? -0 : -500) * (this.config.scene.shader_zoom || 1);
  }

  /**
   * Updates the config reference and refreshes uniforms that depend on it.
   * Called when the user changes shader parameters (speed, opacity, etc.)
   * without switching to a different shader.
   */
  updateConfig(config: ConfigType): void {
    this.config = config;
    this.uniforms.iOpacity.value = config.scene.shader_opacity ?? 1.0;
    this.mesh.position.z =
      (isMobile ? -0 : -500) * (config.scene.shader_zoom || 1);
    if (this.shaderMaterial) {
      this.shaderMaterial.blending = this.resolveBlending(config.scene.shader_blending);
      this.shaderMaterial.needsUpdate = true;
    }
  }

  /** Maps config blending string to Three.js blending constant. */
  private resolveBlending(mode?: string): number {
    switch (mode) {
      case "normal": return NormalBlending;
      case "subtractive": return SubtractiveBlending;
      default: return AdditiveBlending;
    }
  }

  /**
   * Updates the shader time uniform and applies sin/cos position animation
   * if configured. Called on each animation frame.
   */
  update(time: number): void {
    if (!isMobileOnly) {
      const sinSpeed = this.config.scene.shader_sin_cos_speed || 1;
      const sinSpace = this.config.scene.shader_sin_cos_space || 1;
      if (this.config.scene.shader_sin_cos_x) {
        this.mesh.position.x = Math.sin(time * sinSpeed) * sinSpace;
      }
      if (this.config.scene.shader_sin_cos_y) {
        this.mesh.position.y = Math.cos(time * sinSpeed) * sinSpace;
      }
    }

    this.uniforms.iTime.value = time * (this.config.scene.shader_speed || 1);
  }
}
