export const ConfigVariations = [
  {
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
        color: "#06F0ff",
        show: false,
        motionBlur: true,
        motionBlurLength: 0.25,
        z: -244,
      },
    },
    composer: {
      bloom: { show: true, strength: 0.34, threshold: 0.43, radius: 3.1 },
      film: { show: false },
      static: { show: false },
      rgb: { show: false },
      hue: { show: false },
    },
  },
  {
    scene: {
      shader: "Med2",
      background: "./images/w8.jpg",
      shader_speed: 0.6,
      shader_opacity: -1,
      blur: 0,
      brightness: 60,
      bgColor: "#000000",
    },
    vumeters: {
      oscilloscop: {
        color: "#00BBFF",
        show: false,
        motionBlur: false,
        z: -244,
      },
    },
    composer: {
      bloom: { show: true, strength: 0.13, threshold: 0.49, radius: 4 },
      film: {
        show: true,
        count: 2000,
        sIntensity: 1,
        nIntensity: 0.2,
        grayscale: false,
      },
      hue: { show: false },
      rgb: { show: false },
      static: { show: true },
    },
  },
  {
    scene: {
      shader: "Med1",
      shader_speed: 0.55,
      shader_opacity: 0.9,
      background: "./images/w6.jpg",
      blur: 0,
      brightness: 20,
      bgColor: "#000000",
    },
    vumeters: {
      oscilloscop: {
        show: false,
      },
    },
    composer: {
      film: {
        show: true,
        count: 1000,
        sIntensity: 2,
        nIntensity: 0.2,
        grayscale: false,
      },
      bloom: { show: true, strength: 0.38, threshold: 0.88, radius: 1.4 },
      static: { show: true, amount: 0.03, size: 15 },
      rgb: { show: false, amount: 0.016, angle: 0.65 },
      hue: { show: true, hue: 0.77, saturation: 0 },
      film: { show: false },
    },
  },
  {
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
      static: { show: false },
      rgb: { show: false },
      hue: { show: false },
    },
  },
  {
    scene: {
      shader: "Med4",
      shader_speed: 0.25,
      shader_opacity: 0.1,
      background: "./images/w8.jpg",
      blur: 15,
      brightness: 100,
    },
    composer: {
      bloom: { show: true, strength: 0.25, threshold: 0.31, radius: 0.5 },
      film: {
        show: true,
        count: 2000,
        sIntensity: 2,
        nIntensity: 0.34,
        grayscale: false,
      },
      static: { show: true, amount: 0.03, size: 15 },
      rgb: { show: false, amount: 0.016, angle: 0.65 },
      hue: { show: false },
    },
  },
  {
    scene: {
      shader: "Med4",
      shader_speed: 0.65,
      shader_opacity: -0.6,
      background: "./images/w9.jpg",
      blur: 5,
      brightness: 30,
    },
    vumeters: {
      oscilloscop: { show: false },
    },
    composer: {
      bloom: { show: false },
      film: {
        show: false,
        count: 1000,
        sIntensity: 1.11,
        nIntensity: 0.34,
        grayscale: false,
      },
      static: { show: true, amount: 0.097, size: 10 },
      rgb: { show: true, amount: 0.01, angle: 0.6 },
      hue: { show: false },
    },
  },
  {
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
  },
];
