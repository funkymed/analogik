import clean from "./clean";

export default {
  ...clean,
  scene: {
    shader: "Med2",
    shader_speed: .25,
    shader_opacity: .5,
    background: "./images/w9.jpg",
    blur: 20,
    brightness: 200,
    bgColor: "#000000",
  },
  vumeters: {
    oscilloscop: {
      show: true,
    },
  },
  composer: {
    film: {
      show: true,
      count: 1000,
      sIntensity: 3,
      nIntensity: 0.2,
      grayscale: false,
    },
    bloom: { show: true, strength: 0.28, threshold: 0.73, radius: 1.5 },
    static: { show: true, amount: 0.03, size: 15 },
    rgb: { show: false, amount: 0.016, angle: 0.65 },
    // hue: { show: true, hue: 0.77, saturation: 0 },
    // film: { show: false },
  },
};
