import { getRandomInt, getRandomItem } from "../../tools";
import clean from "./clean";

const color = getRandomItem(["#3352b9", "#ff55dd","#dd55ff", "#ff55ff","#55bb55","#994400"]);

export default {
  ...clean,
  scene: {
    shader: getRandomItem(["Texture", "Texture2", "Texture3"]),
    background: `./images/w${getRandomInt(1, 13)}.jpg`,
    shader_speed: getRandomItem([1, 2, 0.5]),
    shader_opacity: 0.1,
    blur: 0,
    brightness: 1,
    bgColor: "#000000",
  },
  timer: {
    opacity: 0.22,
  },
  vumeters: {
    oscilloscop: {
      show: true,
      color,
    },
  },
  composer: {
    bloom: { show: true, strength: 0.81, threshold: 0.2, radius: 0.5 },
    film: {
      show: true,
      count: 1500,
      sIntensity: 1,
      nIntensity: 0.2,
      grayscale: false,
    },
    hue: { show: false },
    rgb: { show: false },
    static: { show: false },
  },
  texts: {
    title: {
      show: true,
      order: 0,
      text: "Analogik",
      font: "Lobster",
      x: 0,
      y: 130,
      z: -650,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      size: 150,
      color,
    },
    subtitle: {
      show: true,
      order: 5,
      text: "Chiptune netlabel",
      font: "Kdam Thmor Pro",
      x: -70,
      y: -19,
      z: -650,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      size: 39,
      color: getRandomItem(["#7e7e8e", "#223", "#222"]),
    },
  },
};
