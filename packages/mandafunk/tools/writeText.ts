import { createMesh } from "./createMesh";
import { fillText } from "./fillText";

/**
 * Creates a 3D mesh containing rendered text.
 * Draws text onto a canvas, then maps it as a texture onto a plane mesh.
 *
 * @param name - Unique name for the mesh
 * @param text - The text string to render
 * @param options - Configuration options (font, size, color, position, etc.)
 * @returns A Three.js Mesh with the text as its texture
 */
export const writeText = function (name: string, text: string, options: any) {
  const texture = fillText(
    text,
    options.font || "Arial",
    options.size || 64,
    options.color || "black",
    options.align || "center"
  );

  const mesh: any = createMesh(name, texture, options, true);
  mesh.objType = options.objType;
  return mesh;
};
