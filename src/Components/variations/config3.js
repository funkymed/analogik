import clean from "./clean";

export default {
  ...clean,
  scene: {
    shader: "Med1",
    shader_speed: 0.55,
    shader_opacity: 0.9,
    background: "./images/w6.jpg",
    blur: 0,
    brightness: 20,
    bgColor: "#000000",
  },
  vumeters: {
    oscilloscop: {
      show: false,
    },
  },
  composer: {
    film: {
      show: true,
      count: 1000,
      sIntensity: 2,
      nIntensity: 0.2,
      grayscale: false,
    },
    bloom: { show: true, strength: 0.38, threshold: 0.88, radius: 1.4 },
    static: { show: true, amount: 0.03, size: 15 },
    rgb: { show: false, amount: 0.016, angle: 0.65 },
    hue: { show: true, hue: 0.77, saturation: 0 },
    film: { show: false },
  },
};
