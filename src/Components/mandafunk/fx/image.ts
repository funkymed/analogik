import { Mesh, MeshBasicMaterial, PlaneGeometry, Scene } from "three";
import { deepClone } from "../tools/deepClone.ts";
import { loadImage } from "../tools/loadImage.ts";
import { ConfigType, ImageType } from "../types/config.ts";

export const updateImages = function (scene: Scene, config: ConfigType) {
  for (let mesh in scene.children) {
    const item: any = scene.children[mesh];
    const objType: string = item?.objType || "undefined";
    if (objType === "image") {
      scene.remove(item);
    }
  }

  for (let image in config.images) {
    if (typeof config.images[image] === "object") {
      let options = deepClone(config.images[image]);
      if (options) {
        options.objType = "image";
      }
      if (options.show) {
        loadImage(image, options.path, options, scene);
      }
    }
  }
};

function getMeshFromScene(scene: Scene, name: string): any {
  return scene.getObjectByName(name);
}

export const updateImageAnimation = function (
  scene: Scene,
  config: ConfigType,
  time: number
) {
  for (let image in config.images) {
    if (config.images[image].animation) {
      const mesh: any = getMeshFromScene(scene, image);
      if (mesh) {
        if (config.images[image].animation.position) {
          for (let axe in config.images[image].animation.position) {
            mesh.position[axe] =
              time * config.images[image].animation.position[axe];
          }
        }
        if (config.images[image].animation.rotation) {
          for (let axe in config.images[image].animation.rotation) {
            mesh.rotation[axe] =
              time * config.images[image].animation.rotation[axe];
          }
        }
      }
    }
  }
};

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

    const zoom: number = configImage.zoom ?? 1;
    const width: number = Math.round((material.map?.image.width ?? 1) * zoom);
    const height: number = Math.round((material.map?.image.height ?? 1) * zoom);

    console.log(width, height);
    const plane: PlaneGeometry = new PlaneGeometry(width, height);
    meshObj.geometry = plane;
  }
};
