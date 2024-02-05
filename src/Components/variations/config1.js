import clean from "./clean";

export default {
  ...clean,
  scene: {
    shader: "Med2",
    background: "./images/w11.jpg",
    shader_speed: 0.8,
    shader_opacity: 0.15,
    blur: 2,
    brightness: 5,
    bgColor: "#000000",
  },
  vumeters: {
    oscilloscop: {
      color: "#FFFF22",
      show: true,
      opacity: 1,
      motionBlur: true,
      motionBlurLength: 0.15,
      z: -300,
    },
  },
  composer: {
    bloom: { show: true, strength: 0.74, threshold: 0.43, radius: 1 },
    film: { show: false },
    static: { show: false },
    rgb: { show: false },
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
      color: "#ff5555",
    },
  },
};