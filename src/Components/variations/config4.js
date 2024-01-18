import clean from "./clean";

export default {
  ...clean,
  scene: {
    shader: "Med1",
    shader_speed: 0.2,
    shader_opacity: 0.4,
    background: "./images/w1.jpg",
    blur: 0,
    brightness: 150,
    bgColor: "#000000",
  },
  vumeters: {
    oscilloscop: {
      color: "#ff006f",
      show: true,
      motionBlur: true,
      motionBlurLength: 0.09,
      z: -300,
    },
  },
  composer: {
    bloom: { show: true, strength: 0.28, threshold: 0.89, radius: 2.3 },
    film: {
      show: true,
      count: 814,
      sIntensity: 0.08,
      nIntensity: 0.64,
      grayscale: false,
    },
  },
};
