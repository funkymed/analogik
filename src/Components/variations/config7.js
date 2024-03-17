import clean from "./clean";

export default {
  ...clean,
  scene: {
    shader: "Med3",
    shader_speed: 0.007,
    shader_opacity: 0.08,
    background: "./images/w10.jpg",
    blur: 0,
    brightness: 10,
  },
  timer: {
    opacity: 0.25,
  },
  vumeters: {
    oscilloscop: {
      color: "#9c8969",
      show: true,
      motionBlur: true,
      z: -650,
      motionBlurLength: 0.15,
    },
  },
  composer: {
    bloom: { show: true, strength: 0.32, threshold: 0.19, radius: .2 },
    film: {
      show: true,
      count: 1000,
      sIntensity: 1.05,
      nIntensity: 0.15,
      grayscale: false,
    },
    hue: { show: false },
    rgb: { show: false },
    static: { show: true, amount: 0.03, size: 15 },
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
      color: "#00BBFF",
    },
    subtitle: {
      show: true,
      order: 5,
      text: "Chiptune netlabel",
      font: "Kdam Thmor Pro",
      opacity: 0.5,
      x: -70,
      y: -19,
      z: -650,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      size: 39,
      color: "#000000",
    },
  },
};
