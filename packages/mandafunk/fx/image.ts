import { AdditiveBlending, Mesh, MeshBasicMaterial, NormalBlending, PlaneGeometry, Scene, SubtractiveBlending } from "three";
import { deepClone } from "../tools/deepClone";
import { loadImage } from "../tools/loadImage";
import { ConfigType, ImageType } from "../config/types";

/**
 * Updates all image overlays in the scene based on configuration.
 * Removes existing image meshes and recreates them from the current config.
 *
 * @param scene - The Three.js Scene containing the image meshes
 * @param config - Current configuration with image definitions
 */
export const updateImages = function (scene: Scene, config: ConfigType) {
  // Collect first, then remove — avoids mutating array mid-iteration
  const toRemove = scene.children.filter((child: any) => child?.objType === "image");
  for (const item of toRemove) {
    const mesh = item as Mesh;
    mesh.geometry?.dispose();
    const mat = mesh.material as MeshBasicMaterial;
    mat?.map?.dispose();
    mat?.dispose();
    scene.remove(item);
  }

  for (let image in config.images) {
    if (typeof (config.images as any)[image] === "object") {
      let options = deepClone((config.images as any)[image]);
      if (options) {
        options.objType = "image";
      }
      if (options.show) {
        loadImage(image, options.path, options, scene);
      }
    }
  }
};

function getMeshFromScene(scene: Scene, name: string): Mesh | undefined {
  return scene.getObjectByName(name) as Mesh | undefined;
}

/**
 * Updates image overlay animations each frame.
 * Applies position and rotation animations based on time.
 *
 * @param scene - The Three.js Scene containing the image meshes
 * @param config - Current configuration with animation definitions
 * @param time - Current animation time in seconds
 */
export const updateImageAnimation = function (
  scene: Scene,
  config: ConfigType,
  time: number
) {
  for (let image in config.images) {
    if ((config.images as any)[image].animation) {
      const mesh: any = getMeshFromScene(scene, image);
      if (mesh) {
        if ((config.images as any)[image].animation.position) {
          for (let axe in (config.images as any)[image].animation.position) {
            mesh.position[axe] =
              time * (config.images as any)[image].animation.position[axe];
          }
        }
        if ((config.images as any)[image].animation.rotation) {
          for (let axe in (config.images as any)[image].animation.rotation) {
            mesh.rotation[axe] =
              time * (config.images as any)[image].animation.rotation[axe];
          }
        }
      }
    }
  }
};

/**
 * Quickly updates an individual image overlay's transform and visibility
 * without recreating the mesh.
 *
 * @param name - Name of the image mesh in the scene
 * @param scene - The Three.js Scene containing the mesh
 * @param configImage - Updated image configuration
 */
export const updateImageFast = function (
  name: string,
  scene: Scene,
  configImage: ImageType
) {
  const meshObj = scene.getObjectByName(name) as Mesh;
  const material = meshObj.material as MeshBasicMaterial;
  if (meshObj && material) {
    meshObj.visible = configImage?.show;
    meshObj.position.set(configImage.x, configImage.y, configImage.z);
    meshObj.rotation.set(
      configImage.rotationX,
      configImage.rotationY,
      configImage.rotationZ
    );
    meshObj.renderOrder = configImage.order;
    material.opacity = configImage.opacity;
    if (configImage.blending) {
      switch (configImage.blending) {
        case "additive": material.blending = AdditiveBlending; break;
        case "subtractive": material.blending = SubtractiveBlending; break;
        default: material.blending = NormalBlending; break;
      }
    }

    const zoom: number = configImage.zoom ?? 1;
    const width: number = Math.round(
      (material.map?.image.width ?? 1) * zoom
    );
    const height: number = Math.round(
      (material.map?.image.height ?? 1) * zoom
    );

    meshObj.geometry.dispose();
    meshObj.geometry = new PlaneGeometry(width, height);
  }
};
