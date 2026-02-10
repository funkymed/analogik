import {
  CanvasTexture,
  LinearFilter,
  LinearMipmapNearestFilter,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Texture,
  Vector3,
} from "three";

/** Options for creating a textured mesh. */
interface CreateMeshOptions {
  x?: number;
  y?: number;
  z?: number;
  width?: number;
  height?: number;
  zoom?: number;
  order?: number;
  opacity?: number;
  needsUpdate?: boolean;
  objType?: string;
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
}

/**
 * Creates a textured plane mesh for use in the 3D scene.
 * Used for rendering canvas-based visualizations (spectrum, oscilloscope, timer, etc.)
 * as well as image overlays.
 *
 * @param name - Unique name identifier for the mesh
 * @param image - Canvas element or Three.js Texture to use as the map
 * @param options - Positioning, sizing, and rendering options
 * @param isCanvas - Whether the image parameter is a raw canvas element
 * @returns A configured Three.js Mesh
 */
export const createMesh = function (
  name: string,
  image: HTMLCanvasElement | Texture,
  options: CreateMeshOptions,
  isCanvas: boolean
): Mesh {
  const map = isCanvas ? new CanvasTexture(image as HTMLCanvasElement) : (image as Texture);

  map.magFilter = LinearFilter;
  map.minFilter = LinearMipmapNearestFilter;
  map.needsUpdate = options.needsUpdate || true;

  const material = new MeshBasicMaterial({
    depthTest: false,
    transparent: true,
    map: map,
    opacity: options.opacity || 1,
  });

  const zoom: number = options.zoom ?? 1;
  const width: number = options.width ?? (image as any).width ?? 1;
  const height: number = options.height ?? (image as any).height ?? 1;
  const plane: PlaneGeometry = new PlaneGeometry(width * zoom, height * zoom);
  const mesh: any = new Mesh(plane, material);

  if (options.objType) {
    mesh.objType = options.objType;
  }

  const center: Vector3 = new Vector3();
  mesh.geometry.computeBoundingBox();
  mesh.geometry.boundingBox.getCenter(center);
  mesh.geometry.center();
  mesh.position.copy(center);

  mesh.name = name;
  mesh.overdraw = true;
  mesh.renderOrder = options.order || 0;
  mesh.position.set(options.x || 0, options.y || 0, options.z || 0);
  mesh.rotation.set(
    options.rotationX || 0,
    options.rotationY || 0,
    options.rotationZ || 0
  );

  return mesh;
};
