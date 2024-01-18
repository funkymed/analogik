import clean from "./clean";

export default {
  ...clean,
  scene: {
    shader: "Med2",
    background: "./images/w8.jpg",
    shader_speed: 0.6,
    shader_opacity: -1,
    blur: 0,
    brightness: 60,
    bgColor: "#000000",
  },
  vumeters: {
    oscilloscop: {
      show: false,
    },
  },
  composer: {
    bloom: { show: true, strength: 0.13, threshold: 0.49, radius: 4 },
    film: {
      show: true,
      count: 2000,
      sIntensity: 1,
      nIntensity: 0.2,
      grayscale: false,
    },
    hue: { show: false },
    rgb: { show: false },
    static: { show: true },
  },
};
