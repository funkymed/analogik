import { hextoRGB } from "../tools/color";
import { ConfigType } from "../config/types";
import { canvas2texture, canvasTexture } from "../tools/canvas2texture";
import { createMesh } from "../tools/createMesh";
import {
  AdditiveBlending,
  Mesh,
  MeshBasicMaterial,
  NormalBlending,
  PlaneGeometry,
  Scene,
} from "three";
import { spectrum } from "../fx/spectrum";
import { oscillo } from "../fx/oscilloscope";
import { progressbar } from "../fx/progressbar";
import { progresstimer } from "../fx/progresstimer";
import { SparksManager } from "../fx/SparksManager";

/**
 * Manages the static visual elements rendered on canvas textures in the 3D scene.
 * These include the spectrum analyzer, oscilloscope, progress bar, and timer display.
 *
 * Each element is drawn on a 2D canvas, converted to a Three.js texture, and
 * displayed on a plane mesh in the 3D scene. The elements are updated every frame
 * with fresh audio data and playback position.
 */
export class StaticItems {
  /** Current configuration for all visual elements. */
  config: ConfigType;
  /** Web Audio API AudioContext for audio analysis. */
  audio: AudioContext;
  /** AnalyserNode providing frequency and time-domain audio data. */
  analyser: AnalyserNode;
  /** Canvas texture for the spectrum analyzer. */
  textureSpectrum: canvas2texture;
  /** Canvas texture for the oscilloscope. */
  textureOscillo: canvas2texture;
  /** Canvas texture for the progress bar. */
  textureProgress: canvas2texture;
  /** Canvas texture for the timer display. */
  textureTimer: canvas2texture;
  /** 3D mesh displaying the spectrum analyzer. */
  vumeterObj: Mesh;
  /** 3D mesh displaying the oscilloscope. */
  oscilloObj: Mesh;
  /** 3D mesh displaying the timer. */
  timerObj: Mesh;
  /** 3D mesh displaying the progress bar. */
  progressbarObj: Mesh;
  /** Reference to the Three.js Scene. */
  scene: Scene;
  /** Reference to the audio player instance. */
  player: any;
  /** Track metadata (unused internally, available for external access). */
  meta: any;
  /** Current animation time. */
  time: number;
  /** Sparks particle system manager. */
  sparksManager: SparksManager;

  /**
   * Creates and initializes all static visual elements.
   *
   * @param config - Configuration controlling element appearance and positioning
   * @param player - Audio player instance (must support duration(), getPosition(), currentPlayingNode)
   * @param audio - Web Audio API AudioContext
   * @param analyser - AnalyserNode connected to the audio source
   * @param scene - Three.js Scene to add the visual elements to
   */
  constructor(
    config: ConfigType,
    player: any,
    audio: AudioContext,
    analyser: AnalyserNode,
    scene: Scene
  ) {
    this.config = config;
    this.audio = audio;
    this.analyser = analyser;
    this.scene = scene;
    this.player = player;
    this.time = 0;

    // Spectrum
    this.textureSpectrum = canvasTexture(
      config.vumeters.spectrum.width,
      config.vumeters.spectrum.height
    );
    this.vumeterObj = createMesh(
      "vumeter",
      this.textureSpectrum.texture,
      {
        x: config.vumeters.spectrum.x,
        y: config.vumeters.spectrum.y,
        z: config.vumeters.spectrum.z,
        order: 2,
        width: config.vumeters.spectrum.width,
        height: config.vumeters.spectrum.height,
      },
      false
    ) as Mesh;
    this.scene.add(this.vumeterObj);

    // Oscilloscope
    this.textureOscillo = canvasTexture(
      config.vumeters.oscilloscop.width,
      config.vumeters.oscilloscop.height
    );
    this.oscilloObj = createMesh(
      "oscillo",
      this.textureOscillo.texture,
      {
        x: config.vumeters.oscilloscop.x,
        y: config.vumeters.oscilloscop.y,
        z: config.vumeters.oscilloscop.z,
        width: config.vumeters.oscilloscop.width,
        height: config.vumeters.oscilloscop.height,
        order: 2,
      },
      false
    ) as Mesh;
    this.scene.add(this.oscilloObj);

    // Progress bar
    this.textureProgress = canvasTexture(
      config.progressbar.width,
      config.progressbar.height
    );

    this.progressbarObj = createMesh(
      "progressbar",
      this.textureProgress.texture,
      {
        x: config.progressbar.x || 0,
        y: config.progressbar.y || 0,
        z: config.progressbar.z || 0,
        width: config.progressbar.width,
        height: config.progressbar.height,
        order: 2,
      },
      false
    ) as Mesh;
    this.scene.add(this.progressbarObj);

    // Timer
    this.textureTimer = canvasTexture(
      config.progressbar.width,
      config.progressbar.height
    );

    this.timerObj = createMesh(
      "timer",
      this.textureTimer.texture,
      {
        x: config.timer.x,
        y: config.timer.y,
        z: config.timer.z,
        width: config.timer.width,
        height: config.timer.height,
        order: 2,
      },
      false
    );
    this.scene.add(this.timerObj);

    this.sparksManager = new SparksManager(scene);

    this.update(config);
  }

  /**
   * Replaces the AnalyserNode (e.g., after audio source reconnection).
   * @param analyser - The new AnalyserNode to use
   */
  setAnalyser(analyser: AnalyserNode) {
    this.analyser = analyser;
  }

  /**
   * Replaces the audio player instance.
   * @param player - The new player instance
   */
  setPlayer(player: any) {
    this.player = player;
  }

  /**
   * Updates all mesh positions, rotations, and blending modes
   * from the provided configuration.
   *
   * @param config - The new configuration to apply
   */
  update(config: ConfigType) {
    this.config = config;
    this.updateMesh(this.progressbarObj, config.progressbar);
    this.updateMesh(this.timerObj, config.timer);
    this.updateMesh(this.vumeterObj, config.vumeters.spectrum);
    this.updateMesh(this.oscilloObj, config.vumeters.oscilloscop);
    this.sparksManager.update(config.sparks);
  }

  /**
   * Updates a single mesh's transform, blending, and geometry from options.
   *
   * @param mesh - The Three.js Mesh to update
   * @param option - Configuration options for position, rotation, blending, etc.
   */
  updateMesh(mesh: Mesh, option: any) {
    const material = mesh.material as MeshBasicMaterial;
    material.blending = option.motionBlur ? AdditiveBlending : NormalBlending;
    mesh.material = material;

    mesh.position.set(option.x || 0, option.y || 0, option.z || 0);
    mesh.rotation.set(
      option.rotationX || 0,
      option.rotationY || 0,
      option.rotationZ || 0
    );
    mesh.renderOrder = option.order || 0;

    const zoom: number = option.zoom ?? 1;
    const width: number = option.width ?? material.map?.image.width ?? 1;
    const height: number = option.height ?? material.map?.image.height ?? 1;

    const plane: PlaneGeometry = new PlaneGeometry(width * zoom, height * zoom);
    mesh.geometry = plane;
  }

  /**
   * Renders a single frame of all visual elements.
   * Updates spectrum, oscilloscope, progress bar, and timer based on
   * current audio data and playback position.
   *
   * @param time - Current animation time in seconds
   */
  rendering(time: number) {
    this.time = time;

    // Update sparks particles
    if (this.config.sparks?.enabled) {
      this.sparksManager.rendering(time);
    }

    this.vumeterObj.visible = this.config.vumeters.spectrum.show;
    this.oscilloObj.visible = this.config.vumeters.oscilloscop.show;
    this.timerObj.visible = this.config.timer.show;
    this.progressbarObj.visible = this.config.progressbar.show;

    if (this.textureSpectrum && this.textureSpectrum.context && this.analyser) {
      spectrum(
        this.textureSpectrum.context,
        this.config.vumeters.spectrum,
        this.analyser
      );
      this.textureSpectrum.texture.needsUpdate = true;

      if (this.config.vumeters.oscilloscop.show) {
        oscillo(
          this.textureOscillo.context,
          this.config.vumeters.oscilloscop,
          this.analyser
        );
        this.textureOscillo.texture.needsUpdate = true;
      }
    }

    let position = 0;
    let duration = 0;
    if (this.player?.currentPlayingNode) {
      duration = this.player.duration();
      position = this.player.currentPlayingNode
        ? this.player.getPosition() < this.player.duration()
          ? this.player.getPosition()
          : this.player.duration()
        : 0;
    }

    if (this.config.progressbar.show) {
      const progressAudio = (position / duration) * 100;
      progressbar(
        this.textureProgress.context,
        hextoRGB(this.config.progressbar.color),
        this.config.progressbar.cursorColor,
        this.config.progressbar.bgColor,
        this.config.progressbar.opacity,
        progressAudio
      );
      this.textureProgress.texture.needsUpdate = true;
    }
    if (this.config.timer.show) {
      progresstimer(
        this.textureTimer.context,
        hextoRGB(this.config.timer.color),
        this.config.timer.bgColor,
        this.config.timer.opacity,
        this.config.timer.size,
        this.config.timer.font,
        position,
        duration,
        this.config.timer.align ?? "center"
      );
      this.textureTimer.texture.needsUpdate = true;
    }
  }
}
