/**
 * @module @mandarine/mandafunk/shaders
 *
 * Shader system for the Mandafunk visualization engine.
 *
 * This module provides the abstract base class for background shaders,
 * a dynamic loader for on-demand shader loading, and type definitions
 * for the shader interface.
 *
 * All 56 individual shader files are loaded dynamically via code splitting
 * to keep the initial bundle size minimal.
 */

export { ShaderAbstract } from "./ShaderAbstract";
export type { BackgroundShader, TextureSpectrumProvider } from "./ShaderAbstract";
export { loadShader, availableShaders } from "./shaderLoader";
