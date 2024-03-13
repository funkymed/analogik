import { WebGLRenderer, Vector2, Scene, PerspectiveCamera } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { SelectiveUnrealBloomPass } from "./shaders/UnrealBloomPass.ts";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { StaticShader } from "./shaders/StaticShader.ts";
import { FilmShader } from "./shaders/FilmShader.ts";
import { RGBShiftShader } from "./shaders/RGBShiftShader.ts";
import { HueSaturationShader } from "./shaders/HueSaturationShader.ts";
import { KaleidoShader } from "./shaders/KaleidoShader.ts";
import { LensShader } from "./shaders/LensShader.ts";
import { FXAAShader } from "./shaders/FXAAShader.ts";
import { ColorifyShader } from "./shaders/ColorifyShader.ts";
import { WaterShader } from "./shaders/WaterShader.ts";
import { ConfigType } from "../types/config.ts";
import { MandaScene } from "../scene.ts";

export class Composer {
  composer: EffectComposer;
  width: number;
  height: number;
  bloomPass: any;
  filmPass: ShaderPass;
  staticPass: ShaderPass;
  rgbPass: ShaderPass;
  kaleiPass: ShaderPass;
  huePass: ShaderPass;
  lensPass: ShaderPass;
  colorifyPass: ShaderPass;
  waterPass: ShaderPass;
  scene: Scene;
  mandaScene: MandaScene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;

  constructor(
    renderer: WebGLRenderer,
    mandaScene: MandaScene,
    camera: PerspectiveCamera
  ) {
    this.composer = new EffectComposer(renderer);
    this.renderer = renderer;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

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
    this.mandaScene = mandaScene;
    this.scene = mandaScene.getScene();
    this.camera = camera;
  }

  updateComposer(config: ConfigType) {
    this.composer = new EffectComposer(this.renderer);
    this.composer.setSize(this.width, this.height);

    // Pipeline rendering
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    var effectFXAA = new ShaderPass(FXAAShader);
    effectFXAA.uniforms.resolution.value.set(
      1 / (this.width ?? 0),
      1 / (this.height ?? 0)
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
      this.bloomPass["radius"] = config.composer.bloom.radius;
      this.bloomPass["threshold"] = config.composer.bloom.threshold;
      this.bloomPass["strength"] = config.composer.bloom.strength;
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
  }

  rendering(time: number) {
    this.filmPass.uniforms["time"].value = time;
    this.staticPass.uniforms["time"].value = time;
    this.kaleiPass.uniforms["angle"].value = time / 10;
    this.kaleiPass.uniforms["sides"].value = 4 + Math.sin(time) * 16;

    this.waterPass.uniforms["time"].value = time;

    this.composer.render(time);
    this.mandaScene.updateShader(time);
  }
}
