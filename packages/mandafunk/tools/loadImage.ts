import { Scene, TextureLoader } from "three";
import { createMesh } from "./createMesh";

/**
 * Loads an image file and creates a textured mesh in the scene.
 * Uses Three.js TextureLoader for async image loading.
 *
 * @param name - Unique name for the mesh
 * @param file - Image file URL or path
 * @param options - Configuration options (position, rotation, opacity, etc.)
 * @param scene - The Three.js Scene to add the mesh to
 */
export const loadImage = function (
  name: string,
  file: string,
  options: any,
  scene: Scene
) {
  new TextureLoader().load(
    file,
    (image) => {
      const mesh: any = createMesh(name, image, options, false);
      mesh.objType = options.objType;
      scene.add(mesh);
    },
    undefined,
    undefined
  );
};
