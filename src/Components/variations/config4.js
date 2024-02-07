import clean from "./clean";

export default {
  ...clean,
  scene: {
    shader: "Med1",
    shader_speed: 0.2,
    shader_opacity: 0.1,
    background: "./images/w1.jpg",
    blur: 3,
    brightness: 50,
    bgColor: "#000000",
  },
  timer: {
    opacity: 0.5,
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
    bloom: { show: true, strength: 0.74, threshold: 0.43, radius: 1 },
    film: {
      show: true,
      count: 814,
      sIntensity: 0.08,
      nIntensity: 0.64,
      grayscale: false,
    },
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
      color: "#3388Ff",
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
      color: "#000000",
    },
  },
};
