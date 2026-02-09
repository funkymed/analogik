import { availableShaders } from "../fx/shaders/background/shaderLoader.ts";

export const selectImagesPochette: string[] = [
  "",
  "./images/w1.jpg",
  "./images/w2.jpg",
  "./images/w3.jpg",
  "./images/w4.jpg",
  "./images/w5.jpg",
  "./images/w6.jpg",
  "./images/w7.jpg",
  "./images/w8.jpg",
  "./images/w9.jpg",
  "./images/w10.jpg",
  "./images/w11.jpg",
  "./images/w12.jpg",
  "./images/w13.jpg",
];

export const selectImagesVinyl: string[] = [
  "",
  "./images/vinyl.png",
  "./images/vinyl2.png",
  "./images/vinyl3.png",
  "./images/vinyl4.png",
  "./images/vinyl5.png",
  "./images/vinyl6.png",
  "./images/vinyl7.png",
  "./images/vinyl8.png",
  "./images/vinyl9.png",
  "./images/vinyla.png",
  "./images/vinylb.png",
  "./images/vinyl-rr-med.png",
  "./images/vinyl-cream.png",
];

export const varFloat: any = {
  blur: [0, 200, 1],
  hue: [0, 1, 0.01],
  saturation: [0, 1, 0.01],
  brightness: [0, 200, 1],
  opacity: [0, 1, 0.01],
  width: [0, 1024, 1],
  height: [0, 1024, 1],
  bars: [0, 256, 1],
  amount: [0, 1, 0.001],
  count: [0, 1000, 1],
  size: [0, 256, 1],
  radius: [0, 10, 0.1],
  threshold: [0, 1, 0.01],
  strength: [0, 1, 0.01],
  angle: [0, 2, 0.01],
  sIntensity: [0, 3, 0.01],
  nIntensity: [0, 3, 0.01],
  rotationX: [-2, 2, 0.01],
  rotationY: [-2, 2, 0.01],
  rotationZ: [-2, 2, 0.01],
  cylindricalRatio: [0.25, 4, 0.1],
};

export const varFont: string[] = [
  "Arial",
  "Helvetica",
  "Robot",
  "Verdana",
  "East Sea Dokdo",
  "Alfa Slab One",
  "Lobster",
  "Pacifico",
  "Permanent Marker",
  "Kdam Thmor Pro",
];

export const varAlign = ["left", "center"];

// Liste des shaders disponibles pour le GUI (sans les charger)
export const varShader = ["", ...availableShaders];
