import { Color, Scene, LinearFilter } from "three";
import { canvas2texture, canvasTexture } from "./tools/canvas2texture.ts";
import { ConfigType } from "./types/config.ts";
import { configDefault } from "./config.ts";
import { deepClone } from "./tools/deepClone.ts";
import { shaders } from "./fx/shaders/background/index.ts";
import { StaticItems } from "./fx/static.ts";
import { isMobile } from "react-device-detect";

export class MandaScene {
  scene: Scene;
  background: HTMLImageElement;
  config: ConfigType;
  shader: any;
  staticItems: StaticItems | false;

  constructor() {
    this.scene = new Scene();
    this.config = deepClone(configDefault);
    this.background = new Image();
    this.shader = false;
    this.staticItems = false;
  }

  setStatic(staticItems: StaticItems) {
    this.staticItems = staticItems;
  }

  getScene(): Scene {
    return this.scene;
  }

  onLoad() {
    const texture: canvas2texture = canvasTexture(
      this.background.width,
      this.background.height
    );
    const context = texture.context;
    if (context) {
      const blur = this.config.scene.blur || 0;
      let brightness: number = this.config.scene.brightness || 100;
      if (isMobile) {
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

    // fixed streched background
    const targetAspect = window.innerWidth / window.innerHeight;
    const imageAspect = 1920 / 1080;
    const factor = imageAspect / targetAspect;
    this.scene.background.offset.x = factor > 1 ? (1 - 1 / factor) / 2 : 0;
    this.scene.background.repeat.x = factor > 1 ? 1 / factor : 1;
    this.scene.background.offset.y = factor > 1 ? 0 : (1 - factor) / 2;
    this.scene.background.repeat.y = factor > 1 ? 1 : factor;
  }

  updateSceneBackground(config: ConfigType) {
    this.config = config;
    this.addShaderBackground();
    if (config.scene.bgColor) {
      this.scene.background = new Color(config.scene.bgColor);
    }

    if (config.scene.background) {
      this.background = new Image();
      this.background.onload = this.onLoad.bind(this);
      this.background.src = config.scene.background;
    }
  }

  addShaderBackground() {
    this.scene.background = null;
    if (this.shader) {
      this.shader.clear();
    }
    if (!this.config.scene.shader || this.config.scene.shader === "") {
      return false;
    }
    this.shader = new shaders[this.config.scene.shader]();

    this.shader.init(this.config, this.scene, this.staticItems);
  }

  updateShader(time: number) {
    if (this.shader.uniforms) {
      this.shader.update(time);
    }
  }

  updateAfterResize() {
    if (this.shader) {
      this.shader.updateResolution();
    }
  }

  clearScene() {
    for (let mesh in this.scene.children) {
      const item: any = this.scene.children[mesh];
      const objType: string = item?.objType || "undefined";
      if (objType === "text" || objType === "image") {
        this.scene.remove(this.scene.children[mesh]);
      }
    }
  }
}
