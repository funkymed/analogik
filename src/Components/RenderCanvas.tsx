import {
  Clock,
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  WebGLRenderer,
  EquirectangularReflectionMapping,
  Color,
  Vector3,
} from "three";
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
import { TTFLoader } from "three/examples/jsm/loaders/TTFLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { deepMergeObjects } from "../tools.js";
import Sparks from "./sparks.js";
import { isMobile, isMobileOnly } from "react-device-detect";
import { useWindowResize } from "../hooks/useWindowResize";

const isEditor = getHttpParam("editor");

function RenderCanvas(props: any): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>();
  const isInit = useRef<boolean>(false);
  const portrait = useRef<boolean>(false);
  const clock = useRef<Clock>();
  const staticItems = useRef<StaticItems>();
  const editorGui = useRef<Editor>();
  const currentConfig = useRef<ConfigType>();
  const currentLogo = useRef<Mesh>();
  const newConfig = useRef<any>();
  const manda_scene = useRef<MandaScene>();
  const renderer = useRef<WebGLRenderer>();
  const composer = useRef<Composer>();
  const camera = useRef<PerspectiveCamera>();
  const time = useRef<number>(0);
  const sparks = useRef<any>();
  const shaderOffset = useRef<number>(0);
  const animateId = useRef<number>();

  const handleResize = useCallback(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;

    if (camera.current) {
      camera.current.aspect = W / H;
      portrait.current = camera.current.aspect < 1 ? true : false;

      camera.current.updateProjectionMatrix();
      if (isMobile) {
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
      manda_scene.current.updateAfterResize();
    }
    time.current = clock.current ? clock.current.getElapsedTime() : 0;

    render(time.current);
  }, [time]);

  const loadConfig = useCallback(
    async (config: ConfigType) => {
      if (!isMobileOnly) {
        if (config.texts && config.texts["title"]) {
          config.texts["title"].text = "";
          config.texts["subtitle"].text = "";
        }
      }

      if (manda_scene.current && staticItems.current && composer.current) {
        await manda_scene.current.updateSceneBackground(config);
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

  const addLogo = () => {
    const loader = new TTFLoader();

    // Loading the TTF font file from Fontsource CDN. Can also be the link to font file from Google Fonts
    loader.load("./fonts/Lobster-Regular.ttf", (fontData) => {
      // Convert the parsed fontData to the format Three.js understands
      const font = new Font(fontData);

      // Create the text geometry
      const textGeometry = new TextGeometry("Analogik", {
        font: font,
        size: 18,
        height: 5,
        curveSegments: 64,
        bevelEnabled: true,
        bevelThickness: 0.5,
        bevelOffset: 0.05,
        bevelSize: 0.5,
        bevelSegments: 1,
      });

      // Textures
      const hdrEquirect = new RGBELoader().load(
        "./images/empty_warehouse_01_2k.hdr",
        () => {
          hdrEquirect.mapping = EquirectangularReflectionMapping;
        }
      );

      let color = "0xffffff";
      if (
        currentConfig.current &&
        currentConfig.current.texts &&
        currentConfig.current.texts["title"]
      ) {
        color = currentConfig.current.texts["title"].color;
      }

      const material = new MeshPhysicalMaterial({
        envMap: hdrEquirect,
        reflectivity: 0.95,
        roughness: 0.001,
        metalness: 0.25,
        clearcoat: 0.5,
        clearcoatRoughness: 0.95,
        transmission: 1.1,
        ior: 1.8,
        thickness: 10,
        color: new Color(color),
      });

      const textMesh = new Mesh(textGeometry, material);

      const position = new Vector3();

      textMesh.rotation.x = 50;
      textMesh.position.set(0, 10, -70);
      textMesh.getWorldPosition(position);
      textMesh.geometry.center();

      if (manda_scene.current) {
        manda_scene.current.getScene().add(textMesh);
        currentLogo.current = textMesh;
      }
    });
  };

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

    if (!isMobileOnly) {
      addLogo();
    }

    sparks.current = [];
    sparks.current.push(
      new Sparks(manda_scene.current.getScene(), 100, "#ff0000", 0.5, 0.15)
    );
    sparks.current.push(
      new Sparks(manda_scene.current.getScene(), 200, "#FFFFFF", 0.25, 0.25)
    );
    sparks.current.push(
      new Sparks(manda_scene.current.getScene(), 100, "#00BBFF", 0.5, 0.2)
    );
  }, [props.analyser, props.audioContext, props.player]);

  const render = (time: number) => {
    // renderer.render(scene, camera)
    if (composer.current) {
      // camera.current.position.x = Math.sin(time) * 5;
      // camera.current.position.y = Math.cos(time) * 2;
      composer.current.rendering(time);
    }
  };

  const animate = useCallback(() => {
    animateId.current = requestAnimationFrame(animate);
    time.current = clock.current ? clock.current.getElapsedTime() : 0;

    if (currentLogo.current) {
      currentLogo.current.rotation.y = Math.sin(time.current / 4) * 0.15;
      currentLogo.current.rotation.x = 25 + Math.sin(time.current / 5) * 0.25;
      currentLogo.current.position.z = -70 + Math.sin(time.current / 2);
    }

    if (manda_scene.current && currentConfig.current && staticItems.current) {
      updateImageAnimation(
        manda_scene.current.getScene(),
        currentConfig.current,
        time.current
      );
      staticItems.current.rendering(time.current);
    }
    if (sparks.current && props.newConfig.scene.sparks === true) {
      for (let p of sparks.current) {
        p.rendering(time.current);
      }
    }

    render(time.current);
  }, [time]);

  useEffect(() => {
    init();
    animate();
    handleResize();
    return () => {
      if (animateId.current) {
        cancelAnimationFrame(animateId.current);
      }
    };
  }, []);

  // React to config changes: merge new config, load scene, signal ready
  useEffect(() => {
    if (
      props.newConfig &&
      manda_scene.current &&
      staticItems.current &&
      composer.current
    ) {
      // Apply mobile brightness reduction
      if (isMobile && props.newConfig.scene) {
        props.newConfig.scene.brightness /= 4;
        props.newConfig.scene.brightness =
          props.newConfig.scene.brightness < 0
            ? 0
            : props.newConfig.scene.brightness;
      }

      // Merge new config values into current config
      deepMergeObjects(props.newConfig, currentConfig.current);

      loadConfig(currentConfig.current).then(() => {
        if (props.onSceneReady) {
          props.onSceneReady();
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.newConfig]);

  // Update audio analyser when music starts playing
  useEffect(() => {
    if (props.isPlay && staticItems.current && props.player) {
      const analyser = props.player.getAnalyser();
      if (analyser) {
        staticItems.current.setAnalyser(analyser);
      }
    }
  }, [props.isPlay, props.player]);

  useWindowResize(handleResize);

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
