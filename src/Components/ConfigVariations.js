export const ConfigVariations = [
  {
    scene: {
      shader: "Med2",
      background: "./images/w6.jpg",
      shader_speed: 0.8,
      shader_opacity: 0.15,
      blur: 15,
      brightness: 50,
      bgColor: "#000000",
    },
    vumeters: {
      oscilloscop: {
        color: "#06F0ff",
        show: true,
        motionBlur: true,
        motionBlurLength: 0.15,
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
      background: "./images/w8.jpg",
      shader_speed: .6,
      shader_opacity: -.86,
      blur: 35,
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
    },
  },
  {
    scene: {
      shader: "Med1",
      shader_speed: 0.2,
      shader_opacity: -1,
      background: "./images/w3.jpg",
      blur: 10,
      brightness: 30,
      bgColor: "#000000",
    },
    vumeters: {
      oscilloscop: {
        color: "#FFAA99",
        show: true,
        motionBlur: true,
        opacity: .25,
        motionBlurLength: 0.19,
        z: -650,
      },
    },
  },
  {
    scene: {
      shader: "Med1",
      shader_speed: 0.2,
      shader_opacity: 0.4,
      background: "./images/w1.jpg",
      blur: 10,
      brightness: 50,
      bgColor: "#000000",
    },
    vumeters: {
      oscilloscop: {
        color: "#ff006f",
        show: true,
        motionBlur: true,
        motionBlurLength:.09,
        z: -300,
      },
    },
  },
  {
    scene: {
      shader: "Med4",
      shader_speed: 0.25,
      shader_opacity: 0.10,
      background: "./images/w8.jpg",
      blur: 15,
      brightness: 100,
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
      background: "./images/w9.jpg",
      blur: 5,
      brightness: 30,
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
      shader: "Med3",
      shader_speed: 0.15,
      shader_opacity: .2,
      background: "./images/w10.jpg",
      blur: 0,
      brightness: 10,
    },
    vumeters: {
      osciloscop: { show: false, motionBlur: 0.15 },
    },
    composer: {
      film: { show: false},
    },
  },
];
