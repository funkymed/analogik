import clean from "./clean";

export default {
  ...clean,
  scene: {
    shader: "Med3",
    shader_speed: 0.15,
    shader_opacity: 0.2,
    background: "./images/w10.jpg",
    blur: 0,
    brightness: 10,
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
    bloom: { show: true, strength: 0.19, threshold: 0.77, radius: 3.5 },
    film: { show: false },
    hue: { show: false },
    rgb: { show: false },
    static: { show: false },
  },
};
