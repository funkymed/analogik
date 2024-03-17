import clean from "./clean";

export default {
  ...clean,
  scene: {
    shader: "Plasma3",
    background: "./images/w12.jpg",
    shader_speed: 1,
    shader_opacity: .08,
    blur: 5,
    brightness: 60,
    bgColor: "#000000",
  },
  timer: {
    opacity: 0.2,
  },
  vumeters: {
    oscilloscop: {
      show: true,
      color: "#aa8833",
    },
  },
  composer: {
    bloom: { show: true, strength: 0.43, threshold: 0.3, radius: 1 },
    film: {
      show: true,
      count: 1500,
      sIntensity: 1,
      nIntensity: .2,
      grayscale: false,
    },
    hue: { show: false },
    rgb: { show: false },
    static: { show: false},
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
      color: "#FFBB00",
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
      color: "#7e7e8e",
    },
  },
};
