import clean from "./clean";

export default {
  ...clean,
  scene: {
    shader: "Med2",
    background: "./images/w5.jpg",
    shader_speed: 0.5,
    shader_opacity: 0.5,
    blur: 0,
    brightness: 40,
    bgColor: "#000000",
  },
  timer: {
    opacity: 0.2,
  },
  vumeters: {
    oscilloscop: {
      show: false,
    },
  },
  composer: {
    bloom: { show: true, strength: 0.74, threshold: 0.43, radius: 1.5 },
    film: {
      show: true,
      count: 2000,
      sIntensity: 1,
      nIntensity: 0.2,
      grayscale: false,
    },
    hue: { show: false },
    rgb: { show: false },
    static: { show: true, amount: 0.065, size: 3 },
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
      color: "#88bbff",
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
      color: "#ff55dd",
    },
  },
};
