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
import { getHttpParam } from "./mandafunk/tools/http.ts";

const isEditor = getHttpParam("editor");

function RenderCanvas(props: any): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>();
  const isInit = useRef<boolean>();
  const clock = useRef<Clock>();
  const staticItems = useRef<StaticItems>();
  const editorGui = useRef<Editor>();
  const currentConfig = useRef<ConfigType>();
  const manda_scene = useRef<MandaScene>();
  const renderer = useRef<WebGLRenderer>();
  const composer = useRef<Composer>();

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
    var shaders = [
      { shader: "Med1", shader_speed: 1 },
      { shader: "Med2", shader_speed: 1 },
      { shader: "Med3", shader_speed: 1 },
      { shader: "Med4", shader_speed: 1 },
      { shader: "Color2", shader_speed: 5 },
      { shader: "Cloud2", shader_speed: 5 },
      { shader: "PolarViz", shader_speed: 3 },
      { shader: "Cube2", shader_speed: 2 },
      { shader: "Galaxy", shader_speed: 0.05 },
    ];

    var shader = shaders[Math.floor(Math.random() * shaders.length)];
    config.scene.shader = shader.shader;
    config.scene.shader_speed = shader.shader_speed;
    if (manda_scene.current && staticItems.current && composer.current) {
      manda_scene.current.updateSceneBackground(config);
      manda_scene.current.clearScene();
      updateImages(manda_scene.current.getScene(), config);
      updateTexts(manda_scene.current.getScene(), config);
      staticItems.current.update(config);
      updateImageAnimation(manda_scene.current.getScene(), config, time);
      composer.current.updateComposer(config);

      if (editorGui.current) {
        editorGui.current.updateGui(config);
      }
    }
  };

  const render = (time: number) => {
    // renderer.render(scene, camera)
    if (composer.current) {
      composer.current.rendering(time);
    }
  };

  const handleResize = () => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    if (renderer.current) {
      renderer.current.setSize(W, H);
    }
    render(time);
  };

  const animate = () => {
    requestAnimationFrame(animate);
    time = clock.current ? clock.current.getElapsedTime() : 0;
    // time = playing && player ? player.getPosition() : 0
    // console.log(playing, props.isPlay, time)
    if (manda_scene.current && currentConfig.current && staticItems.current) {
      updateImageAnimation(
        manda_scene.current.getScene(),
        currentConfig.current,
        time
      );
      staticItems.current.rendering(time);
    }

    render(time);
  };

  useEffect(() => {
    if (!isInit.current) {
      isInit.current = true;
      init();
      if (currentConfig.current) {
        loadConfig(currentConfig.current);
      }

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

    if (staticItems.current && props.isPlay && currentConfig.current) {
      staticItems.current.setAnalyser(props.player.getAnalyser());
      loadConfig(currentConfig.current);
    }
  }, [props.player.currentPlayingNode]);

  return <canvas className="canvasStyle" ref={canvasRef} />;
}

export default RenderCanvas;
