import clean from "./clean";

export default {
  ...clean,
  scene: {
    shader: "Ice",
    background: "./images/w13.jpg",
    shader_speed: .75 ,
    shader_opacity: .75,
    blur: 1,
    brightness: 100,
    bgColor: "#000000",
  },
  timer: {
    opacity: 0.52,
  },
  vumeters: {
    oscilloscop: {
      show: true,
      color: "#2596be",
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
      order: 0,
      text: "Analogik",
      font: "Lobster",
      x: 0,
      y: 130,
      z: -650,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      size: 150,
      color: "#3352b9",
    },
  },
};
