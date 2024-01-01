import { Clock, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { useEffect, useRef, JSX, useState } from "react";
import { ConfigType } from "./mandafunk/types/config.ts";
import { MandaScene } from "./mandafunk/scene.ts";
import { updateImageAnimation, updateImages } from "./mandafunk/fx/image.ts";
import { updateTexts } from "./mandafunk/fx/text.ts";
import { StaticItems } from "./mandafunk/fx/static.ts";
import { Composer } from "./mandafunk/fx/composer.ts";
import testConfig from "../config.ts";
import { Editor } from "./mandafunk/gui/editor.ts";

const isEditor = true;

function RenderCanvas(props: any): JSX.Element {
  let canvasRef = useRef<HTMLCanvasElement>();
  let isInit = useRef<boolean>();
  let clock = useRef<Clock>();
  let staticItems = useRef<StaticItems>();
  let editorGui = useRef<Editor>();
  let currentConfig = useRef<ConfigType>();
  let manda_scene = useRef<MandaScene>();
  let renderer = useRef<WebGLRenderer>();
  let composer = useRef<Composer>();

  const [playing, setPlaying] = useState<boolean>();
  const [player, setPlayer] = useState<any>();

  let camera: PerspectiveCamera;
  let time: number = 0;

  const init = () => {
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
    camera = new PerspectiveCamera(60, W / H, 0.1, 2000);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    camera.position.set(0, 0, 0);
    camera.lookAt(manda_scene.current.getScene().position);
    camera.layers.enable(1);

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
      camera
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
  };

  const loadConfig = (config: ConfigType) => {
    //Config Init
    var shaders = ["Med1", "Med2", "Med3", "Med4"];
    var shader = shaders[Math.floor(Math.random() * shaders.length)];
    config.scene.shader = shader;

    manda_scene.current.updateSceneBackground(config);
    manda_scene.current.clearScene();
    updateImages(manda_scene.current.getScene(), config);
    updateTexts(manda_scene.current.getScene(), config);
    if (staticItems.current) {
      staticItems.current.update(config);
    }
    updateImageAnimation(manda_scene.current.getScene(), config, time);
    composer.current.updateComposer(config);

    if (editorGui.current) {
      editorGui.current.updateGui(config);
    }
  };

  const render = (time: number) => {
    // renderer.render(scene, camera)
    composer.current.rendering(time);
  };

  const handleResize = () => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.current.setSize(W, H);
    render(time);
  };

  const animate = () => {
    requestAnimationFrame(animate);
    time = clock.current ? clock.current.getElapsedTime() : 0;
    // time = playing && player ? player.getPosition() : 0
    // console.log(playing, props.isPlay, time)

    updateImageAnimation(
      manda_scene.current.getScene(),
      currentConfig.current,
      time
    );
    if (staticItems.current) {
      staticItems.current.rendering(time);
    }

    render(time);
  };

  useEffect(() => {
    if (!isInit.current) {
      isInit.current = true;
      init();
      loadConfig(currentConfig.current);
      window.addEventListener("resize", handleResize);
      animate();
    }
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [loadConfig, animate, isInit, canvasRef, handleResize, init]);

  useEffect(() => {
    setPlayer(props.player);
    setPlaying(props.player.currentPlayingNode ? true : false);
    props.setIsPlay(props.player.currentPlayingNode ? true : false);

    if (staticItems.current && props.isPlay) {
      staticItems.current.setAnalyser(props.player.getAnalyser());
      loadConfig(currentConfig.current);
    }
  }, [props.player.currentPlayingNode]);

  return <canvas className="canvasStyle" ref={canvasRef} />;
}

export default RenderCanvas;
