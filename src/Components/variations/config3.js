import clean from "./clean";

export default {
  ...clean,
  scene: {
    shader: "Med2",
    shader_speed: 0.25,
    shader_opacity: 0.5,
    background: "./images/w7.jpg",
    blur: 5,
    brightness: 60,
    bgColor: "#000000",
  },
  vumeters: {
    oscilloscop: {
      show: true,
    },
  },
  composer: {
    film: {
      show: true,
      count: 1000,
      sIntensity: 1.05,
      nIntensity: 0.15,
      grayscale: false,
    },
    bloom: { show: true, strength: 0.74, threshold: 0.43, radius: 1 },
    static: { show: true, amount: 0.03, size: 15 },
    rgb: { show: false, amount: 0.016, angle: 0.65 },
    // hue: { show: true, hue: 0.77, saturation: 0 },
    // film: { show: false },
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
      color: "#bb8833",
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
