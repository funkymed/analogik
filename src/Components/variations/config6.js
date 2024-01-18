import clean from "./clean";

export default {
  ...clean,
  scene: {
    shader: "Med4",
    shader_speed: 0.65,
    shader_opacity: -0.6,
    background: "./images/w9.jpg",
    blur: 5,
    brightness: 30,
  },
  vumeters: {
    oscilloscop: { show: false },
  },
  composer: {
    bloom: { show: false },
    film: {
      show: false,
      count: 1000,
      sIntensity: 1.11,
      nIntensity: 0.34,
      grayscale: false,
    },
    static: { show: true, amount: 0.097, size: 10 },
    rgb: { show: true, amount: 0.006, angle: 0.6 },
    hue: { show: false },
  },
};
