import clean from "./clean";

export default {
  ...clean,
  scene: {
    background: "./images/w4.jpg",
    blur: 10,
    brightness: 100,
    shader: "Bubble",
    shader_speed: 0.25,
    shader_opacity: 0.5,
  },
  composer: {
    bloom: { show: true, strength: 0.28, threshold: 0.73, radius: 1.5 },
    rgb: { show: false, amount: 0.003, angle: 0.7 },
    film: {
      show: true,
      count: 2000,
      sIntensity: 1,
      nIntensity: 0.2,
      grayscale: false,
    },
    static: { show: false, amount: 0.065, size: 10 },
    lens: { show: true, strength: 0.45, cylindricalRatio: 1, height: 1 },
    hue: { show: false },
  },
};
