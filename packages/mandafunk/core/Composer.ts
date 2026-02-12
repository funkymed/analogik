import { WebGLRenderer, Vector2, Scene, PerspectiveCamera } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { SelectiveUnrealBloomPass } from "../fx/passes/UnrealBloomPass";
import { StaticShader } from "../fx/passes/StaticShader";
import { FilmShader } from "../fx/passes/FilmShader";
import { RGBShiftShader } from "../fx/passes/RGBShiftShader";
import { HueSaturationShader } from "../fx/passes/HueSaturationShader";
import { KaleidoShader } from "../fx/passes/KaleidoShader";
import { LensShader } from "../fx/passes/LensShader";
import { FXAAShader } from "../fx/passes/FXAAShader";
import { ColorifyShader } from "../fx/passes/ColorifyShader";
import { WaterShader } from "../fx/passes/WaterShader";
import { OpacityShader } from "../fx/passes/OpacityPass";
import { ConfigType } from "../config/types";
import { MandaScene } from "./MandaScene";

/**
 * Manages the Three.js post-processing pipeline for the MandaFunk engine.
 * Orchestrates multiple shader passes (bloom, film grain, RGB shift, etc.)
 * and renders the final composited frame.
 *
 * The rendering pipeline order:
 * 1. RenderPass (base scene)
 * 2. FXAA (anti-aliasing)
 * 3. Lens distortion (optional)
 * 4. Kaleidoscope (optional)
 * 5. Water distortion
 * 6. Hue/Saturation (optional)
 * 7. Bloom (optional)
 * 8. RGB shift (optional)
 * 9. Film grain (optional)
 * 10. Static noise (optional)
 */
export class Composer {
  /** The Three.js EffectComposer managing the pass pipeline. */
  composer: EffectComposer;
  /** Current viewport width. */
  width: number;
  /** Current viewport height. */
  height: number;
  /** Bloom post-processing pass. */
  bloomPass: SelectiveUnrealBloomPass;
  /** Film grain shader pass. */
  filmPass: ShaderPass;
  /** Static noise shader pass. */
  staticPass: ShaderPass;
  /** RGB chromatic aberration shader pass. */
  rgbPass: ShaderPass;
  /** Kaleidoscope shader pass. */
  kaleiPass: ShaderPass;
  /** Hue/saturation adjustment shader pass. */
  huePass: ShaderPass;
  /** Lens distortion shader pass. */
  lensPass: ShaderPass;
  /** Colorify shader pass. */
  colorifyPass: ShaderPass;
  /** Water distortion shader pass. */
  waterPass: ShaderPass;
  /** Final opacity shader pass. */
  opacityPass: ShaderPass;
  /** Reference to the Three.js Scene. */
  scene: Scene;
  /** Reference to the MandaScene wrapper. */
  mandaScene: MandaScene;
  /** Reference to the perspective camera. */
  camera: PerspectiveCamera;
  /** Reference to the WebGL renderer. */
  renderer: WebGLRenderer;
  /** Whether the device is mobile (adjusts bloom parameters). */
  isMobile: boolean;

  /**
   * Creates a new Composer with all shader passes initialized.
   *
   * @param renderer - The Three.js WebGLRenderer
   * @param mandaScene - The MandaScene instance wrapping the Three.js Scene
   * @param camera - The perspective camera for the scene
   */
  constructor(
    renderer: WebGLRenderer,
    mandaScene: MandaScene,
    camera: PerspectiveCamera
  ) {
    this.composer = new EffectComposer(renderer);
    this.renderer = renderer;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.isMobile = false;

    this.bloomPass = new SelectiveUnrealBloomPass(
      new Vector2(this.width, this.height),
      1.5,
      0.4,
      0.85
    );

    this.filmPass = new ShaderPass(FilmShader);
    this.staticPass = new ShaderPass(StaticShader);
    this.rgbPass = new ShaderPass(RGBShiftShader);
    this.kaleiPass = new ShaderPass(KaleidoShader);
    this.huePass = new ShaderPass(HueSaturationShader);
    this.colorifyPass = new ShaderPass(ColorifyShader);
    this.lensPass = new ShaderPass(LensShader);
    this.waterPass = new ShaderPass(WaterShader);
    this.opacityPass = new ShaderPass(OpacityShader);
    this.mandaScene = mandaScene;
    this.scene = mandaScene.getScene();
    this.camera = camera;
  }

  /**
   * Sets the mobile device flag. When true, bloom parameters are adjusted.
   * @param mobile - Whether the current device is mobile
   */
  setMobile(mobile: boolean) {
    this.isMobile = mobile;
  }

  /**
   * Rebuilds the post-processing pipeline from the provided configuration.
   * Creates a new EffectComposer and adds passes based on which effects
   * are enabled in the config.
   *
   * @param config - Configuration controlling which effects are active and their parameters
   */
  updateComposer(config: ConfigType) {
    // Dispose previous render targets before creating new composer
    this.composer.dispose();
    this.composer = new EffectComposer(this.renderer);
    this.composer.setSize(this.width, this.height);

    // Pipeline rendering
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    var effectFXAA = new ShaderPass(FXAAShader);
    effectFXAA.uniforms.resolution.value.set(
      1 / window.innerWidth,
      1 / window.innerHeight
    );
    this.composer.addPass(effectFXAA);

    if (config.composer?.lens?.show) {
      this.composer.addPass(this.lensPass);
      this.lensPass.uniforms["strength"].value = config.composer.lens.strength;
      this.lensPass.uniforms["height"].value = config.composer.lens.height;
      this.lensPass.uniforms["aspectRatio"].value = this.width / this.height;
      this.lensPass.uniforms["cylindricalRatio"].value =
        config.composer.lens.cylindricalRatio;
    }

    if (config.composer?.kaleidoscope?.show) {
      this.kaleiPass.uniforms["sides"].value = 5;
      this.composer.addPass(this.kaleiPass);
    }

    this.waterPass.uniforms["resolution"].value = new Vector2(
      this.width,
      this.height
    );
    this.waterPass.uniforms["factor"].value = 0.15;
    this.composer.addPass(this.waterPass);

    if (config.composer?.hue?.show) {
      this.huePass.uniforms["hue"].value = config.composer.hue.hue;
      this.huePass.uniforms["saturation"].value =
        config.composer.hue.saturation;
      this.composer.addPass(this.huePass);
    }
    if (config.composer?.bloom?.show) {
      this.bloomPass["radius"] = !this.isMobile
        ? config.composer.bloom.radius
        : 1.5;
      this.bloomPass["threshold"] = !this.isMobile
        ? config.composer.bloom.threshold
        : 3;
      this.bloomPass["strength"] = !this.isMobile
        ? config.composer.bloom.strength
        : 1;
      this.composer.addPass(this.bloomPass);
    }
    if (config.composer?.rgb?.show) {
      this.rgbPass.uniforms["angle"].value =
        config.composer.rgb.angle * Math.PI;
      this.rgbPass.uniforms["amount"].value = config.composer.rgb.amount;
      this.composer.addPass(this.rgbPass);
    }
    if (config.composer?.film?.show) {
      this.filmPass.uniforms["sCount"].value = config.composer.film.count;
      this.filmPass.uniforms["sIntensity"].value =
        config.composer.film.sIntensity;
      this.filmPass.uniforms["nIntensity"].value =
        config.composer.film.nIntensity;
      this.filmPass.uniforms["grayscale"].value =
        config.composer.film.grayscale;
      this.composer.addPass(this.filmPass);
    }
    if (config.composer?.static?.show) {
      this.staticPass.uniforms["amount"].value = config.composer.static.amount;
      this.staticPass.uniforms["size"].value = config.composer.static.size;
      this.composer.addPass(this.staticPass);
    }

    // Final opacity pass — always added to avoid pipeline rebuilds
    this.opacityPass.uniforms["uOpacity"].value =
      config.scene?.opacity ?? 1;
    this.composer.addPass(this.opacityPass);
  }

  /**
   * Disposes all GPU resources held by the composer (render targets, passes).
   */
  dispose() {
    this.composer.dispose();
  }

  /**
   * Renders a single frame through the post-processing pipeline.
   * Updates time-dependent uniforms and delegates to the EffectComposer.
   *
   * @param time - Current animation time in seconds
   */
  rendering(time: number) {
    this.filmPass.uniforms["time"].value = time;
    this.staticPass.uniforms["time"].value = time;
    this.kaleiPass.uniforms["angle"].value = time / 10;
    this.kaleiPass.uniforms["sides"].value = 4 + Math.sin(time) * 16;

    this.waterPass.uniforms["time"].value = time / 10;

    this.composer.render(time);
    this.mandaScene.updateShader(time);
  }
}
