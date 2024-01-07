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
import { deepMergeObjects } from "../tools.js";
import { ConfigVariations } from "./ConfigVariations.js";

const isEditor = getHttpParam("editor");

function RenderCanvas(props: any): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>();
  const isInit = useRef<boolean>();
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

  const handleResize = useCallback(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    if (camera.current) {
      camera.current.aspect = W / H;
      camera.current.updateProjectionMatrix();
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
      newConfig.current =
        ConfigVariations[Math.floor(Math.random() * ConfigVariations.length)];

      deepMergeObjects(newConfig.current, config);

      console.log("load config", config);

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
    console.log("init mandfunk");
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

    handleResize();
  }, [
    handleResize,
    loadConfig,
    props.analyser,
    props.audioContext,
    props.player,
  ]);

  const render = (time: number) => {
    // renderer.render(scene, camera)
    if (composer.current) {
      composer.current.rendering(time);
    }
  };

  const animate = useCallback(() => {
    requestAnimationFrame(animate);
    time.current = clock.current ? clock.current.getElapsedTime() : 0;

    // let position = 0;
    // if (props.player.currentPlayingNode) {
    //   position = props.player.currentPlayingNode
    //     ? props.player.getPosition() < props.player.duration()
    //       ? props.player.getPosition()
    //       : props.player.duration()
    //     : 0;
    // }
    // time = position;

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
    if (!isInit.current) {
      isInit.current = true;
      init();
      if (currentConfig.current) {
        loadConfig(currentConfig.current);
      }

      animate();
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [loadConfig, animate, isInit, handleResize, init]);

  useEffect(() => {
    props.setIsPlay(props.player.currentPlayingNode ? true : false);

    if (staticItems.current && props.isPlay && currentConfig.current) {
      staticItems.current.setAnalyser(props.player.getAnalyser());
      loadConfig(currentConfig.current);
    }
  }, [props.player.currentPlayingNode, loadConfig]);

  return <canvas className="canvasStyle" ref={canvasRef} />;
}

export default RenderCanvas;
