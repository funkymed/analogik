import clean from "./clean";

export default {
  ...clean,
  scene: {
    background: "./images/w4.jpg",
    blur: 5,
    brightness: 50,
    shader: "Bubble",
    shader_speed: 0.25,
    shader_opacity: 0.5,
  },
  composer: {
    bloom: { show: true, strength: 0.74, threshold: 0.43, radius: 1 },
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
  texts: {
    title: {
      show: true,
      order: 5,
      text: "Analogik",
      font: "Lobster",
      x: 0,
      y: 130,
      z: -650,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      size: 150,
      color: "#8659D8",
    },
  },
};
