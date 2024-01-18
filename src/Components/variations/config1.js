import clean from "./clean";

export default {
  ...clean,
  scene: {
    shader: "Med2",
    background: "./images/w11.jpg",
    shader_speed: 0.8,
    shader_opacity: 0.15,
    blur: 0,
    brightness: 50,
    bgColor: "#000000",
  },
  vumeters: {
    oscilloscop: {
      color: "#FFFF22",
      show: true,
      opacity: 1,
      motionBlur: true,
      motionBlurLength: 0.35,
      z: -250,
    },
  },
  composer: {
    bloom: { show: true, strength: 0.34, threshold: 0.43, radius: 3.1 },
    film: { show: false },
    static: { show: false },
    rgb: { show: false },
    hue: { show: false },
  },
};
