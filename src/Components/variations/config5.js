import clean from "./clean";

export default {
  ...clean,
  scene: {
    shader: "Med4",
    shader_speed: 0.25,
    shader_opacity: 0.1,
    background: "./images/w8.jpg",
    blur: 15,
    brightness: 100,
  },
  composer: {
    bloom: { show: true, strength: 0.25, threshold: 0.31, radius: 0.5 },
    film: {
      show: true,
      count: 2000,
      sIntensity: 2,
      nIntensity: 0.34,
      grayscale: false,
    },
    static: { show: true, amount: 0.03, size: 15 },
  },
};
