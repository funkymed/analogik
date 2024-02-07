import clean from "./clean";

export default {
  ...clean,
  scene: {
    bgColor: "#000000",
    background: "./images/w8.jpg",
    blur: 0,
    brightness: 40,
    shader: "Combustible",
    shader_speed: 0.15,
    shader_opacity: 0.5,
  },
  progressbar: {
    opacity: 0.2,
  },
  timer: {
    opacity: 0.75,
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
      color: "#AA8800",
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
      color: "#994400",
    },
  },
};
