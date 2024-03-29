import clean from "./clean";

export default {
  ...clean,
  scene: {
    shader: "Vortex",
    background: "./images/w2.jpg",
    shader_speed: 3,
    shader_opacity: .1,
    shader_zoom: 0.9,
    shader_sin_cos_x: true,
    shader_sin_cos_y: true,
    shader_sin_cos_speed: 0.05,
    shader_sin_cos_space: 150,
    blur: 2,
    brightness: 70,
  },
  timer: {
    opacity: 0.2,
  },
  vumeters: {
    oscilloscop: {
      show: true,
      color: "#FFBB00",
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
      color: "#FFDD55",
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
