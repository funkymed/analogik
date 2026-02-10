import { Texture } from "three";

/**
 * Represents a canvas-backed texture for drawing 2D graphics
 * that can be used as Three.js texture maps.
 */
export interface canvas2texture {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D | null;
  texture: Texture;
}

/**
 * Creates a canvas element with an associated Three.js texture.
 * Used for rendering 2D visualizations (spectrum, oscilloscope, etc.)
 * that are mapped onto 3D meshes in the scene.
 *
 * @param w - Canvas width in pixels
 * @param h - Canvas height in pixels
 * @returns Object containing the canvas, its 2D context, and a Three.js Texture
 */
export function canvasTexture(w: number, h: number): canvas2texture {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const texture = new Texture(canvas);
  texture.needsUpdate = true;

  const context = canvas.getContext("2d");
  return { canvas, context, texture };
}
