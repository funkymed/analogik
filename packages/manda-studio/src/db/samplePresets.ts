/**
 * Sample scene presets to seed the library on first launch.
 * These demonstrate different visual styles and shader combinations.
 */

import type { ConfigType } from "@mandafunk/config/types";
import { configDefault } from "@mandafunk/config/defaults";
import { db } from "./database";
import { createPreset } from "./presetService";

function makeConfig(overrides: Partial<ConfigType>): ConfigType {
  return {
    ...structuredClone(configDefault),
    ...overrides,
    scene: { ...configDefault.scene, ...overrides.scene },
    composer: {
      ...configDefault.composer,
      ...overrides.composer,
      bloom: { ...configDefault.composer.bloom, ...overrides.composer?.bloom },
      rgb: { ...configDefault.composer.rgb, ...overrides.composer?.rgb },
      film: { ...configDefault.composer.film, ...overrides.composer?.film },
      static: { ...configDefault.composer.static, ...overrides.composer?.static },
      hue: { ...configDefault.composer.hue, ...overrides.composer?.hue },
    },
    vumeters: {
      oscilloscop: {
        ...configDefault.vumeters.oscilloscop,
        ...overrides.vumeters?.oscilloscop,
      },
      spectrum: {
        ...configDefault.vumeters.spectrum,
        ...overrides.vumeters?.spectrum,
      },
    },
  };
}

const sampleScenes: Array<{
  name: string;
  tags: string[];
  description: string;
  config: ConfigType;
}> = [
  {
    name: "Neon Plasma",
    tags: ["colorful", "energetic", "shader"],
    description: "Vibrant plasma shader with strong bloom and multicolor spectrum.",
    config: makeConfig({
      scene: {
        bgColor: "",
        background: "",
        blur: 0,
        brightness: 90,
        shader: "Plasma",
        shader_speed: 0.8,
        shader_opacity: 1.0,
      },
      composer: {
        bloom: { show: true, strength: 0.9, threshold: 0.6, radius: 0.5 },
        rgb: { show: true, amount: 0.003, angle: 0.5 },
        film: { show: true, count: 800, sIntensity: 0.15, nIntensity: 0.4, grayscale: false },
        static: { show: false, amount: 0.2, size: 2 },
        hue: { show: true, hue: 0, saturation: 0 },
      },
      vumeters: {
        oscilloscop: {
          ...configDefault.vumeters.oscilloscop,
          show: true,
          color: "#00ff88",
          opacity: 0.9,
        },
        spectrum: {
          ...configDefault.vumeters.spectrum,
          show: true,
          bars: 64,
          multiColor: true,
          opacity: 0.8,
        },
      },
    }),
  },
  {
    name: "Dark Tunnel",
    tags: ["dark", "minimal", "shader"],
    description: "Deep tunnel shader with subtle bloom and centered spectrum.",
    config: makeConfig({
      scene: {
        bgColor: "",
        background: "",
        blur: 0,
        brightness: 70,
        shader: "Tunnel",
        shader_speed: 0.5,
        shader_opacity: 0.9,
      },
      composer: {
        bloom: { show: true, strength: 0.6, threshold: 0.8, radius: 0.2 },
        rgb: { show: false, amount: 0.005, angle: 0.7 },
        film: { show: true, count: 1200, sIntensity: 0.3, nIntensity: 0.7, grayscale: false },
        static: { show: false, amount: 0.2, size: 2 },
        hue: { show: true, hue: 0.6, saturation: 0.2 },
      },
      vumeters: {
        oscilloscop: {
          ...configDefault.vumeters.oscilloscop,
          show: true,
          color: "#6366f1",
          opacity: 0.7,
        },
        spectrum: {
          ...configDefault.vumeters.spectrum,
          show: true,
          bars: 128,
          centerSpectrum: true,
          multiColor: false,
          color: "#6366f1",
          opacity: 0.5,
        },
      },
    }),
  },
  {
    name: "Galaxy Drift",
    tags: ["space", "ambient", "shader"],
    description: "Slow galaxy shader with film grain and gentle bloom.",
    config: makeConfig({
      scene: {
        bgColor: "",
        background: "",
        blur: 0,
        brightness: 85,
        shader: "Galaxy",
        shader_speed: 0.3,
        shader_opacity: 1.0,
      },
      composer: {
        bloom: { show: true, strength: 0.75, threshold: 0.5, radius: 0.8 },
        rgb: { show: false, amount: 0.005, angle: 0.7 },
        film: { show: true, count: 600, sIntensity: 0.1, nIntensity: 0.3, grayscale: false },
        static: { show: false, amount: 0.2, size: 2 },
        hue: { show: true, hue: 0.8, saturation: 0.1 },
      },
      vumeters: {
        oscilloscop: {
          ...configDefault.vumeters.oscilloscop,
          show: true,
          color: "#a78bfa",
          opacity: 0.6,
        },
        spectrum: {
          ...configDefault.vumeters.spectrum,
          show: true,
          bars: 96,
          multiColor: true,
          opacity: 0.4,
        },
      },
    }),
  },
  {
    name: "Retro VHS",
    tags: ["retro", "glitch", "noisy"],
    description: "Heavy film grain, static noise, and RGB shift for a retro VHS look.",
    config: makeConfig({
      scene: {
        bgColor: "#0a0a0a",
        background: "",
        blur: 0,
        brightness: 100,
        shader: "Fractal",
        shader_speed: 0.6,
        shader_opacity: 0.7,
      },
      composer: {
        bloom: { show: true, strength: 0.5, threshold: 0.9, radius: 0.1 },
        rgb: { show: true, amount: 0.008, angle: 1.2 },
        film: { show: true, count: 1500, sIntensity: 0.5, nIntensity: 0.9, grayscale: false },
        static: { show: true, amount: 0.15, size: 3 },
        hue: { show: true, hue: 0.1, saturation: 0.3 },
      },
      vumeters: {
        oscilloscop: {
          ...configDefault.vumeters.oscilloscop,
          show: true,
          color: "#22c55e",
          opacity: 1.0,
          motionBlur: true,
          motionBlurLength: 0.4,
        },
        spectrum: {
          ...configDefault.vumeters.spectrum,
          show: true,
          bars: 32,
          multiColor: false,
          color: "#22c55e",
          opacity: 0.7,
        },
      },
    }),
  },
  {
    name: "Disco Night",
    tags: ["party", "colorful", "shader"],
    description: "Disco shader with strong bloom and vibrant colors.",
    config: makeConfig({
      scene: {
        bgColor: "",
        background: "",
        blur: 0,
        brightness: 110,
        shader: "Disco",
        shader_speed: 1.2,
        shader_opacity: 1.0,
      },
      composer: {
        bloom: { show: true, strength: 1.0, threshold: 0.4, radius: 0.6 },
        rgb: { show: true, amount: 0.004, angle: 0.3 },
        film: { show: false, count: 1000, sIntensity: 0.22, nIntensity: 0.59, grayscale: false },
        static: { show: false, amount: 0.2, size: 2 },
        hue: { show: true, hue: 0.0, saturation: 0.0 },
      },
      vumeters: {
        oscilloscop: {
          ...configDefault.vumeters.oscilloscop,
          show: true,
          color: "#f472b6",
          opacity: 0.8,
        },
        spectrum: {
          ...configDefault.vumeters.spectrum,
          show: true,
          bars: 256,
          multiColor: true,
          opacity: 0.9,
          zoom: 1.2,
        },
      },
    }),
  },
  {
    name: "Ice Crystal",
    tags: ["cold", "minimal", "shader"],
    description: "Icy blue tones with the Ice shader and grayscale film.",
    config: makeConfig({
      scene: {
        bgColor: "",
        background: "",
        blur: 0,
        brightness: 95,
        shader: "Ice",
        shader_speed: 0.4,
        shader_opacity: 1.0,
      },
      composer: {
        bloom: { show: true, strength: 0.7, threshold: 0.65, radius: 0.4 },
        rgb: { show: false, amount: 0.005, angle: 0.7 },
        film: { show: true, count: 500, sIntensity: 0.1, nIntensity: 0.2, grayscale: true },
        static: { show: false, amount: 0.2, size: 2 },
        hue: { show: true, hue: 0.55, saturation: 0.4 },
      },
      vumeters: {
        oscilloscop: {
          ...configDefault.vumeters.oscilloscop,
          show: true,
          color: "#38bdf8",
          opacity: 0.8,
        },
        spectrum: {
          ...configDefault.vumeters.spectrum,
          show: true,
          bars: 128,
          multiColor: false,
          color: "#38bdf8",
          opacity: 0.6,
        },
      },
    }),
  },
];

const SEED_KEY = "mandastudio_seeded_v1";

/**
 * Seeds the database with sample presets on first launch.
 * Checks localStorage to avoid re-seeding.
 */
export async function seedSamplePresets(): Promise<void> {
  if (localStorage.getItem(SEED_KEY)) return;

  const count = await db.presets.count();
  if (count > 0) {
    localStorage.setItem(SEED_KEY, "1");
    return;
  }

  for (const scene of sampleScenes) {
    await createPreset(
      scene.name,
      scene.config,
      "",
      scene.tags,
      scene.description,
    );
  }

  localStorage.setItem(SEED_KEY, "1");
}

/** Returns the first sample config for use as initial scene. */
export function getInitialSampleConfig(): ConfigType {
  return structuredClone(sampleScenes[0].config);
}
