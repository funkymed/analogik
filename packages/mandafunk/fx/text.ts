import { Scene } from "three";
import { deepClone } from "../tools/deepClone";
import { writeText } from "../tools/writeText";
import { ConfigType } from "../config/types";

/**
 * Updates all text overlays in the scene based on configuration.
 * Removes existing text meshes and recreates them from the current config.
 *
 * @param scene - The Three.js Scene containing the text meshes
 * @param config - Current configuration with text definitions
 */
export const updateTexts = function (scene: Scene, config: ConfigType) {
  for (let mesh in scene.children) {
    const item: any = scene.children[mesh];
    const objType: string = item?.objType || "undefined";
    if (objType === "text") {
      scene.remove(item);
    }
  }
  for (let text in config.texts) {
    if (typeof (config.texts as any)[text] === "object") {
      const options = deepClone((config.texts as any)[text]);
      options.objType = "text";
      if (options.show) {
        const mesh: any = writeText(text, options.text, options);
        scene.add(mesh);
      }
    }
  }
};
