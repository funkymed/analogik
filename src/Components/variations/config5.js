import clean from "./clean";

export default {
  ...clean,
  scene: {
    shader: "Med4",
    shader_speed: 0.25,
    shader_opacity: 0.15,
    background: "./images/w8.jpg",
    blur: 5,
    brightness: 35,
  },
  composer: {
    bloom: { show: true, strength: 0.78, threshold: 0.57, radius: 0.5 },
    film: {
      show: true,
      count: 2000,
      sIntensity: 2,
      nIntensity: 0.34,
      grayscale: false,
    },
    static: { show: true, amount: 0.03, size: 15 },
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
      color: "#ff66ff",
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
