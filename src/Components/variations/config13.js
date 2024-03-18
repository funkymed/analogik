import clean from "./clean";

export default {
  ...clean,
  scene: {
    shader: "Color",
    background: "./images/w3.jpg",
    shader_speed: .5,
    shader_opacity: 0.25,
    blur: 2,
    brightness: 100,
    bgColor: "#000000",
    sparks: true,
  },
  timer: {
    opacity: 0.2,
  },
  vumeters: {
    oscilloscop: {
      show: true,
      color: "#55bb88",
    },
  },
  composer: {
    bloom: { show: true, strength: 0.72, threshold: 0.77, radius: 1.5 },
    film: {
      show: true,
      count: 2000,
      sIntensity: 1,
      nIntensity: 0.2,
      grayscale: false,
    },
    hue: { show: false },
    rgb: { show: false },
    static: { show: false, amount: 0.065, size: 3 },
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
      color: "#FFAA55",
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
      color: "#88bbff",
    },
  },
};
