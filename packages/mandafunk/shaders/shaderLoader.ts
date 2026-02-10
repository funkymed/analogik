/**
 * @module @mandarine/mandafunk/shaders/shaderLoader
 *
 * Dynamic Shader Loader
 *
 * This module handles dynamic loading of shaders to avoid loading
 * all 56 shaders (~500 KB) in the initial bundle.
 *
 * Each shader is loaded on-demand via dynamic import.
 */

import type { BackgroundShader } from "./ShaderAbstract";

/** Constructor type for shader classes. */
type ShaderConstructor = new () => BackgroundShader;

/** Mapping of shader names to their dynamic import functions. */
const shaderLoaders: Record<string, () => Promise<any>> = {
  Ball: () => import('./shaders/BallShader'),
  Bubble: () => import('./shaders/BubbleShader'),
  Cube: () => import('./shaders/CubeShader'),
  Cube2: () => import('./shaders/CubeShader2'),
  Cloud2: () => import('./shaders/CloudShader2'),
  Cloud3: () => import('./shaders/CloudShader3'),
  Combustible: () => import('./shaders/CombustibleShader'),
  Color: () => import('./shaders/ColorShader'),
  Color2: () => import('./shaders/ColorShader2'),
  Disco: () => import('./shaders/DiscoShader'),
  Disco2: () => import('./shaders/DiscoShader2'),
  Firestorm: () => import('./shaders/FirestormShader'),
  Fractal: () => import('./shaders/FractalShader'),
  Fractal2: () => import('./shaders/FractalShader2'),
  Frequency: () => import('./shaders/FrequencyShader'),
  Galaxy: () => import('./shaders/GalaxyShader'),
  Hexa: () => import('./shaders/HexaShader'),
  Ice: () => import('./shaders/IceShader'),
  Laser: () => import('./shaders/LaserShader'),
  Med1: () => import('./shaders/Med1Shader'),
  Med2: () => import('./shaders/Med2Shader'),
  Med3: () => import('./shaders/Med3Shader'),
  Med4: () => import('./shaders/Med4Shader'),
  NeonCircle: () => import('./shaders/NeonCircleShader'),
  NeonVortext: () => import('./shaders/NeonVortexShader'),
  NeonWave: () => import('./shaders/NeonWaveShader'),
  Octo: () => import('./shaders/OctoShader'),
  Plasma: () => import('./shaders/PlasmaShader'),
  Plasma2: () => import('./shaders/PlasmaShader2'),
  Plasma3: () => import('./shaders/PlasmaShader3'),
  Pixelos: () => import('./shaders/PixelosShader'),
  PolarViz: () => import('./shaders/PolarVizShader'),
  RadialFft: () => import('./shaders/RadialFftShader'),
  Space: () => import('./shaders/SpaceShader'),
  Spectrum: () => import('./shaders/SpectrumShader'),
  Spiral: () => import('./shaders/SpiralShader'),
  Starfield: () => import('./shaders/StarfieldShader'),
  Stellar: () => import('./shaders/StellarShader'),
  Strange: () => import('./shaders/StrangeShader'),
  Texture: () => import('./shaders/TextureShader'),
  Texture2: () => import('./shaders/TextureShader2'),
  Texture3: () => import('./shaders/TextureShader3'),
  Tetris: () => import('./shaders/TetrisShader'),
  Tube: () => import('./shaders/TubeShader'),
  Tunnel: () => import('./shaders/TunnelShader'),
  Tunnel2: () => import('./shaders/TunnelShader2'),
  Tunnel3: () => import('./shaders/TunnelShader3'),
  Tunnel4: () => import('./shaders/TunnelShader4'),
  TorusPiles: () => import('./shaders/TorusPilesShader'),
  TorusFire: () => import('./shaders/TorusFireShader'),
  Tron: () => import('./shaders/TronShader'),
  Twigl: () => import('./shaders/TwiglShader'),
  Vortex: () => import('./shaders/VortexShader'),
  WaveLine: () => import('./shaders/WaveLineShader'),
  Worm: () => import('./shaders/WormShader'),
};

/**
 * List of available shader names.
 * Used by the GUI to display options without loading the shaders.
 */
export const availableShaders: string[] = Object.keys(shaderLoaders);

/**
 * Dynamically loads a shader by name.
 *
 * @param name - The name of the shader to load (e.g., "Plasma", "Laser")
 * @returns A new instance of the requested shader
 * @throws Error if the shader does not exist or fails to load
 *
 * @example
 * ```typescript
 * const shader = await loadShader("Plasma");
 * shader.init(config, scene, staticItems);
 * ```
 */
export async function loadShader(name: string): Promise<BackgroundShader> {
  const loader = shaderLoaders[name];

  if (!loader) {
    throw new Error(`Shader "${name}" not found. Available shaders: ${availableShaders.join(', ')}`);
  }

  try {
    const module = await loader();

    const ShaderClass: ShaderConstructor =
      module[`${name}Shader`] ||
      module.default ||
      Object.values(module).find(
        (exp: any) => typeof exp === 'function' && exp.prototype
      );

    if (!ShaderClass) {
      throw new Error(`No shader class found in module for "${name}"`);
    }

    return new ShaderClass();
  } catch (error) {
    console.error(`Failed to load shader "${name}":`, error);
    throw error;
  }
}
