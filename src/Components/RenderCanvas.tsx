import { Clock, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { useEffect, useRef, JSX, useState } from "react";
import { ConfigType } from "./mandafunk/types/config.ts";
import { MandaScene } from "./mandafunk/scene.ts";
import { updateImageAnimation, updateImages } from "./mandafunk/fx/image.ts";
import { updateTexts } from "./mandafunk/fx/text.ts";
import { StaticItems } from "./mandafunk/fx/static.ts";
import { Composer } from "./mandafunk/fx/composer.ts";
import testConfig from "../config.ts";

function RenderCanvas(props: any): JSX.Element {
  let canvasRef = useRef<HTMLCanvasElement>();
  let isInit = useRef<boolean>();
  let clock = useRef<Clock>();
  let staticItems = useRef<StaticItems>();
  const [playing, setPlaying] = useState<boolean>();
  const [player, setPlayer] = useState<any>();

  let camera: PerspectiveCamera;
  let manda_scene: MandaScene;
  let renderer: WebGLRenderer;
  let composer: Composer;
  let time: number = 0;
  let scene: Scene;
  let currentConfig: ConfigType;

  const init = () => {
    // init

    let W = window.innerWidth;
    let H = window.innerHeight;

    clock.current = new Clock();

    // Scene
    currentConfig = testConfig;

    manda_scene = new MandaScene();
    scene = manda_scene.getScene();
    staticItems.current = new StaticItems(
      currentConfig,
      props.player,
      props.audioContext,
      props.analyser,
      scene
    );
    manda_scene.setStatic(staticItems.current);

    // Camera
    camera = new PerspectiveCamera(60, W / H, 0.1, 2000);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    camera.position.set(0, 0, 0);
    camera.lookAt(scene.position);
    camera.layers.enable(1);

    // Renderer
    renderer = new WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
      precision: "highp",
      canvas: canvasRef.current,
    });
    renderer.debug.checkShaderErrors = true;
    renderer.autoClear = false;
    renderer.autoClearColor = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    // document.body.appendChild(renderer.domElement)

    // Composer
    composer = new Composer(renderer, manda_scene, camera);

    handleResize();
  };

  const loadConfig = () => {
    //Config Init
    manda_scene.updateSceneBackground(currentConfig);
    manda_scene.clearScene();
    updateImages(scene, currentConfig);
    updateTexts(scene, currentConfig);
    if (staticItems.current) {
      staticItems.current.update(currentConfig);
    }
    updateImageAnimation(scene, currentConfig, time);
    composer.updateComposer(currentConfig);
  };

  const render = (time: number) => {
    // renderer.render(scene, camera)
    composer.rendering(time);
  };

  const handleResize = () => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
    render(time);
  };

  const animate = () => {
    requestAnimationFrame(animate);
    time = clock.current ? clock.current.getElapsedTime() : 0;
    // time = playing && player ? player.getPosition() : 0
    // console.log(playing, props.isPlay, time)

    updateImageAnimation(scene, currentConfig, time);
    if (staticItems.current) {
      staticItems.current.rendering(time);
    }

    render(time);
  };

  useEffect(() => {
    if (!isInit.current) {
      isInit.current = true;
      init();
      loadConfig();
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
    }
  }, [props.player.currentPlayingNode]);

  return <canvas className="canvasStyle" ref={canvasRef} />;
}

export default RenderCanvas;
