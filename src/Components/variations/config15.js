import clean from "./clean";

export default {
  ...clean,
  scene: {
    shader: "Med2",
    background: "./images/w13.jpg",
    shader_speed: 0.75,
    shader_opacity: 0.25,
    shader_zoom: 0.15,
    blur: 2,
    brightness: 25,
    bgColor: "#000000",
  },
  timer: {
    opacity: 0.52,
  },
  vumeters: {
    oscilloscop: {
      show: false,
      color: "#FFFF00",
      z: -180,
    },
  },
  composer: {
    bloom: { show: true, strength: 0.43, threshold: 0.3, radius: 1 },
    film: {
      show: true,
      count: 1500,
      sIntensity: 1,
      nIntensity: 0.2,
      grayscale: false,
    },
    hue: { show: false },
    rgb: { show: false },
    static: { show: false },
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
      color: "#FF8855",
    },
    subtitle: {
      show: true,
      order: 0,
      text: "Chiptune netlabel",
      font: "Kdam Thmor Pro",
      x: -70,
      y: -19,
      z: -650,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      size: 39,
      color: "#aaa",
    },
  },
};
