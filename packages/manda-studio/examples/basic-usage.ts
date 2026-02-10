/**
 * Basic usage of @mandarine/mandafunk
 *
 * This example shows how to create a simple audio visualizer
 * with a shader background and post-processing effects.
 *
 * Prerequisites:
 *   - A canvas element with id="canvas" in your HTML
 *   - An audio file (e.g., .xm, .mod, .mp3) served at /music/track.xm
 *   - The @mandarine/mandafunk package installed
 */

import {
  MandaRenderer,
  configDefault,
  mergeConfig,
  availableShaders,
} from "@mandarine/mandafunk";

// ---------------------------------------------------------------------------
// 1. Set up the canvas and audio context
// ---------------------------------------------------------------------------

const canvas = document.querySelector<HTMLCanvasElement>("#canvas")!;
const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 2048;

// ---------------------------------------------------------------------------
// 2. Create the renderer
// ---------------------------------------------------------------------------

const renderer = new MandaRenderer(canvas, audioCtx, analyser);
await renderer.init();

// ---------------------------------------------------------------------------
// 3. Configure the scene
// ---------------------------------------------------------------------------

// List all available shaders (useful for building a shader picker):
console.log("Available shaders:", availableShaders);

const config = mergeConfig(configDefault, {
  scene: {
    shader: "PlasmaShader",
    shader_speed: 0.8,
    brightness: 90,
  },
  composer: {
    bloom: {
      show: true,
      strength: 0.7,
      threshold: 0.6,
      radius: 0.5,
    },
    film: {
      show: true,
      count: 800,
      sIntensity: 0.15,
      nIntensity: 0.4,
      grayscale: false,
    },
  },
  vumeters: {
    oscilloscop: {
      show: true,
      color: "#00ff88",
      opacity: 0.8,
    },
    spectrum: {
      show: true,
      bars: 64,
      multiColor: true,
    },
  },
});

await renderer.loadConfig(config);

// ---------------------------------------------------------------------------
// 4. Start the render loop
// ---------------------------------------------------------------------------

function animate() {
  renderer.render();
  requestAnimationFrame(animate);
}

animate();

// ---------------------------------------------------------------------------
// 5. Load and play audio
// ---------------------------------------------------------------------------

const response = await fetch("/music/track.xm");
const buffer = await response.arrayBuffer();
const audioBuffer = await audioCtx.decodeAudioData(buffer);

const source = audioCtx.createBufferSource();
source.buffer = audioBuffer;
source.connect(analyser);
analyser.connect(audioCtx.destination);
source.start();

// ---------------------------------------------------------------------------
// 6. Update config in real-time
// ---------------------------------------------------------------------------

// You can change any config property while the renderer is running.
// For example, switch the shader:
renderer.updateConfig(
  mergeConfig(config, {
    scene: { shader: "TunnelShader" },
  }),
);

// ---------------------------------------------------------------------------
// 7. Handle window resize
// ---------------------------------------------------------------------------

window.addEventListener("resize", () => {
  renderer.resize(window.innerWidth, window.innerHeight);
});

// ---------------------------------------------------------------------------
// 8. Cleanup (call when done)
// ---------------------------------------------------------------------------

// renderer.dispose();
