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
  // Collect first, then remove — avoids mutating array mid-iteration
  const toRemove = scene.children.filter((child: any) => child?.objType === "text");
  for (const item of toRemove) {
    const mesh = item as any;
    mesh.geometry?.dispose();
    mesh.material?.map?.dispose();
    mesh.material?.dispose();
    scene.remove(item);
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
