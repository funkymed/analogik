import { Clock, PerspectiveCamera, WebGLRenderer } from "three";
import { useEffect, useRef, JSX, useCallback } from "react";
import { ConfigType } from "./mandafunk/types/config.ts";
import { MandaScene } from "./mandafunk/scene.ts";
import { updateImageAnimation, updateImages } from "./mandafunk/fx/image.ts";
import { updateTexts } from "./mandafunk/fx/text.ts";
import { StaticItems } from "./mandafunk/fx/static.ts";
import { Composer } from "./mandafunk/fx/composer.ts";
import testConfig from "../config.ts";
import { Editor } from "./mandafunk/gui/editor.ts";
import { getHttpParam } from "./mandafunk/tools/http.ts";
import {
  deepMergeObjects,
  getRandomOffset,
  mobileAndTabletCheck,
} from "../tools.js";

const isEditor = getHttpParam("editor");

function RenderCanvas(props: any): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>();
  const isInit = useRef<boolean>(false);
  const portrait = useRef<boolean>(false);
  const clock = useRef<Clock>();
  const staticItems = useRef<StaticItems>();
  const editorGui = useRef<Editor>();
  const currentConfig = useRef<ConfigType>();
  const newConfig = useRef<any>();
  const manda_scene = useRef<MandaScene>();
  const renderer = useRef<WebGLRenderer>();
  const composer = useRef<Composer>();
  const camera = useRef<PerspectiveCamera>();
  const time = useRef<number>(0);
  const shaderOffset = useRef<number>(0);
  const animateId = useRef<number>();

  const handleResize = useCallback(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;

    if (camera.current) {
      camera.current.aspect = W / H;
      portrait.current = camera.current.aspect < 1 ? true : false;

      camera.current.updateProjectionMatrix();
      if (mobileAndTabletCheck()) {
        if (portrait.current === true) {
          camera.current.position.set(0, 0, 500);
        } else {
          camera.current.position.set(0, 0, 70);
        }
      }
    }

    if (renderer.current) {
      renderer.current.setSize(W, H);
    }
    if (manda_scene.current) {
      // manda_scene.current.updateAfterResize();
    }
    time.current = clock.current ? clock.current.getElapsedTime() : 0;

    render(time.current);
  }, [time]);

  const loadConfig = useCallback(
    (config: ConfigType) => {
      if (mobileAndTabletCheck()) {
        props.newConfig.scene.brightness /= 4;
        props.newConfig.scene.brightness =
          props.newConfig.scene.brightness < 0
            ? 0
            : props.newConfig.scene.brightness;
      }
      deepMergeObjects(props.newConfig, config);

      if (manda_scene.current && staticItems.current && composer.current) {
        manda_scene.current.updateSceneBackground(config);
        manda_scene.current.clearScene();
        updateImages(manda_scene.current.getScene(), config);
        updateTexts(manda_scene.current.getScene(), config);
        staticItems.current.update(config);
        updateImageAnimation(
          manda_scene.current.getScene(),
          config,
          time.current
        );
        composer.current.updateComposer(config);

        if (editorGui.current) {
          editorGui.current.updateGui(config);
        }
      }
    },
    [time]
  );
  const init = useCallback(() => {
    // init

    let W = window.innerWidth;
    let H = window.innerHeight;

    clock.current = new Clock();

    // Scene
    currentConfig.current = testConfig;

    manda_scene.current = new MandaScene();
    staticItems.current = new StaticItems(
      currentConfig.current,
      props.player,
      props.audioContext,
      props.analyser,
      manda_scene.current.getScene()
    );
    manda_scene.current.setStatic(staticItems.current);

    // Camera
    camera.current = new PerspectiveCamera(60, W / H, 0.1, 2000);
    camera.current.aspect = W / H;
    camera.current.updateProjectionMatrix();
    camera.current.position.set(0, 0, 0);
    camera.current.lookAt(manda_scene.current.getScene().position);
    camera.current.layers.enable(1);

    // Renderer
    renderer.current = new WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
      precision: "highp",
      canvas: canvasRef.current,
    });
    renderer.current.debug.checkShaderErrors = true;
    renderer.current.autoClear = false;
    renderer.current.autoClearColor = true;
    renderer.current.setPixelRatio(window.devicePixelRatio);
    // document.body.appendChild(renderer.domElement)

    // Composer
    composer.current = new Composer(
      renderer.current,
      manda_scene.current,
      camera.current
    );

    if (isEditor) {
      editorGui.current = new Editor(
        currentConfig.current,
        manda_scene.current,
        composer.current,
        staticItems.current,
        loadConfig
      );
      if (isEditor) {
        editorGui.current.show(true);
      } else {
        editorGui.current.show(false);
      }
    }
  }, [props.analyser, props.audioContext, props.player]);

  const render = (time: number) => {
    // renderer.render(scene, camera)
    if (composer.current) {
      composer.current.rendering(time);
    }
  };

  const animate = useCallback(() => {
    animateId.current = requestAnimationFrame(animate);
    time.current = clock.current ? clock.current.getElapsedTime() : 0;

    if (manda_scene.current && currentConfig.current && staticItems.current) {
      updateImageAnimation(
        manda_scene.current.getScene(),
        currentConfig.current,
        time.current
      );
      staticItems.current.rendering(time.current);
    }

    render(time.current);
  }, [time]);

  useEffect(() => {
    const resizeHandler = () => {
      handleResize();
    };
    window.addEventListener("resize", resizeHandler);

    init();

    if (staticItems.current && currentConfig.current) {
      staticItems.current.setAnalyser(props.player.getAnalyser());
      loadConfig(currentConfig.current);
    }

    animate();
    handleResize();
    return () => {
      window.removeEventListener("resize", resizeHandler);
      if (animateId.current) {
        cancelAnimationFrame(animateId.current);
      }
    };
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.addEventListener("mouseup", props.onClickCanvas);
    }
  }, [canvasRef.current]);

  return (
    <canvas
      ref={canvasRef}
      onClick={props.onClickCanvas}
      className="canvasStyle"
      style={{
        pointerEvents: "auto",
      }}
    />
  );
}

export default RenderCanvas;
