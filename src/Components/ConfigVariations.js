export const ConfigVariations = [
  {
    scene: {
      shader: "Med2",
      background: "./images/w1.jpg",
      shader_speed: 0.15,
      shader_opacity: 0.35,
      blur: 74,
      brightness: 71,
      bgColor: "#000000",
    },
    vumeters: {
      oscilloscop: {
        color: "#ff006f",
        show: true,
        motionBlur: true,
        motionBlurLength:.09,
        z: -244,
      },
    },
    composer: {
      bloom: { show: true, strength: 0.13, threshold: 0.49, radius: 4 },
    },
  },
  {
    scene: {
      shader: "Med2",
      background: "",
      shader_speed: 2,
      shader_opacity: 1.62,
      blur: 20,
      brightness: 20,
      bgColor: "#00FF0F",
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
    },
  },
  {
    scene: {
      shader: "Med1",
      shader_speed: 0.2,
      shader_opacity: -1,
      background: "./images/w1.jpg",
      blur: 80,
      brightness: 50,
      bgColor: "#000000",
    },
    vumeters: {
      oscilloscop: {
        show: true,
        motionBlur: true,
        motionBlurLength:.09,
      },
    },
  },
  {
    scene: {
      shader: "Med1",
      shader_speed: 0.2,
      shader_opacity: 0.4,
      background: "./images/w1.jpg",
      blur: 20,
      brightness: 50,
      bgColor: "#000000",
    },
    vumeters: {
      oscilloscop: {
        color: "#ff006f",
        show: true,
        motionBlur: true,
        motionBlurLength:.09,
        z: -244,
      },
    },
  },
  {
    scene: {
      shader: "Med4",
      shader_speed: 0.65,
      shader_opacity: 0.13,
      background: "./images/w1.jpg",
      blur: 80,
      brightness: 30,
      composer: {
        film: {
          show: true,
          count: 1000,
          sIntensity: 1.11,
          nIntensity: 0.34,
          grayscale: false,
        },
        static: { show: true, amount: 0.097, size: 10 },
        rgb: { show: true, amount: 0.016, angle: 0.65 },
      },
    },
  },
  {
    scene: {
      shader: "Med4",
      shader_speed: 0.65,
      shader_opacity: -0.6,
      background: "./images/w1.jpg",
      blur: 80,
      brightness: 118,
      vumeters: {
        osciloscop: { show: false },
      },
      composer: {
        film: {
          show: true,
          count: 1000,
          sIntensity: 1.11,
          nIntensity: 0.34,
          grayscale: false,
        },
        static: { show: true, amount: 0.097, size: 10 },
        rgb: { show: true, amount: 0.016, angle: 0.65 },
      },
    },
  },
  {
    scene: {
      shader: "Color",
      shader_speed: 0.25,
      shader_opacity: -1,
      background: "./images/w1.jpg",
      blur: 30,
      brightness: 34,
    },
    vumeters: {
      osciloscop: { show: false, motionBlur: 0.15 },
    },
  },
];
