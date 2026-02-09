/**
 * Dynamic Shader Loader
 *
 * Ce module gère le chargement dynamique des shaders pour éviter de charger
 * tous les 56 shaders (~500 KB) dans le bundle initial.
 *
 * Chaque shader est chargé à la demande via dynamic import.
 */

// Type pour les constructeurs de shader
type ShaderConstructor = new () => any;

// Mapping des noms de shaders vers leurs imports dynamiques
const shaderLoaders: Record<string, () => Promise<any>> = {
  Ball: () => import('./BallShader.ts'),
  Bubble: () => import('./BubbleShader.ts'),
  Cube: () => import('./CubeShader.ts'),
  Cube2: () => import('./CubeShader2.ts'),
  Cloud2: () => import('./CloudShader2.ts'),
  Cloud3: () => import('./CloudShader3.ts'),
  Combustible: () => import('./CombustibleShader.ts'),
  Color: () => import('./ColorShader.ts'),
  Color2: () => import('./ColorShader2.ts'),
  Disco: () => import('./DiscoShader.ts'),
  Disco2: () => import('./DiscoShader2.ts'),
  Firestorm: () => import('./FirestormShader.ts'),
  Fractal: () => import('./FractalShader.ts'),
  Fractal2: () => import('./FractalShader2.ts'),
  Frequency: () => import('./FrequencyShader.ts'),
  Galaxy: () => import('./GalaxyShader.ts'),
  Hexa: () => import('./HexaShader.ts'),
  Ice: () => import('./IceShader.ts'),
  Laser: () => import('./LaserShader.ts'),
  Med1: () => import('./Med1Shader.ts'),
  Med2: () => import('./Med2Shader.ts'),
  Med3: () => import('./Med3Shader.ts'),
  Med4: () => import('./Med4Shader.ts'),
  NeonCircle: () => import('./NeonCircleShader.ts'),
  NeonVortext: () => import('./NeonVortexShader.ts'),
  NeonWave: () => import('./NeonWaveShader.ts'),
  Octo: () => import('./OctoShader.ts'),
  Plasma: () => import('./PlasmaShader.ts'),
  Plasma2: () => import('./PlasmaShader2.ts'),
  Plasma3: () => import('./PlasmaShader3.ts'),
  Pixelos: () => import('./PixelosShader.ts'),
  PolarViz: () => import('./PolarVizShader.ts'),
  RadialFft: () => import('./RadialFftShader.ts'),
  Space: () => import('./SpaceShader.ts'),
  Spectrum: () => import('./SpectrumShader.ts'),
  Spiral: () => import('./SpiralShader.ts'),
  Starfield: () => import('./StarfieldShader.ts'),
  Stellar: () => import('./StellarShader.ts'),
  Strange: () => import('./StrangeShader.ts'),
  Texture: () => import('./TextureShader.ts'),
  Texture2: () => import('./TextureShader2.ts'),
  Texture3: () => import('./TextureShader3.ts'),
  Tetris: () => import('./TetrisShader.ts'),
  Tube: () => import('./TubeShader.ts'),
  Tunnel: () => import('./TunnelShader.ts'),
  Tunnel2: () => import('./TunnelShader2.ts'),
  Tunnel3: () => import('./TunnelShader3.ts'),
  Tunnel4: () => import('./TunnelShader4.ts'),
  TorusPiles: () => import('./TorusPilesShader.ts'),
  TorusFire: () => import('./TorusFireShader.ts'),
  Tron: () => import('./TronShader.ts'),
  Twigl: () => import('./TwiglShader.ts'),
  Vortex: () => import('./VortexShader.ts'),
  WaveLine: () => import('./WaveLineShader.ts'),
  Worm: () => import('./WormShader.ts'),
};

/**
 * Liste des noms de shaders disponibles.
 * Utilisé par le GUI pour afficher les options sans charger les shaders.
 */
export const availableShaders: string[] = Object.keys(shaderLoaders);

/**
 * Charge dynamiquement un shader par son nom.
 *
 * @param name - Le nom du shader à charger (ex: "Plasma", "Laser", etc.)
 * @returns Une instance du shader demandé
 * @throws Error si le shader n'existe pas
 *
 * @example
 * ```typescript
 * const shader = await loadShader("Plasma");
 * shader.init(config, scene, staticItems);
 * ```
 */
export async function loadShader(name: string): Promise<any> {
  const loader = shaderLoaders[name];

  if (!loader) {
    throw new Error(`Shader "${name}" not found. Available shaders: ${availableShaders.join(', ')}`);
  }

  try {
    // Charge le module du shader dynamiquement
    const module = await loader();

    // Récupère la classe exportée du shader
    // Cherche d'abord par convention (ex: PlasmaShader), sinon prend le premier export classe
    const ShaderClass: ShaderConstructor =
      module[`${name}Shader`] ||
      module.default ||
      Object.values(module).find(
        (exp: any) => typeof exp === 'function' && exp.prototype
      );

    if (!ShaderClass) {
      throw new Error(`No shader class found in module for "${name}"`);
    }

    // Retourne une nouvelle instance du shader
    return new ShaderClass();
  } catch (error) {
    console.error(`Failed to load shader "${name}":`, error);
    throw error;
  }
}
