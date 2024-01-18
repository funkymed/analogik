import clean from "./clean";

export default {
  ...clean,
  scene: {
    bgColor: "#000000",
    background: "./images/w8.jpg",
    blur: 25,
    brightness: 200,
    shader: "Combustible",
    shader_speed: 0.75,
    shader_opacity: 0.65,
  },
  progressbar: {
    opacity: 0.2,
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
