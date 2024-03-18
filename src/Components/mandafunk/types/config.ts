export interface ImageType {
  show: boolean;
  path: string;
  order: number;
  opacity: number;
  x: number;
  y: number;
  z: number;
  zoom: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  objType?: string;
  animation?: any;
}

export interface TextType {
  show: boolean;
  text: string;
  order: number;
  color: string;
  font: string;
  size: number;
  opacity: number;
  x: number;
  y: number;
  z: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  objType?: string;
}

interface ComposerType {
  bloom: {
    show: boolean;
    strength: number;
    threshold: number;
    radius: number;
  };
  film: {
    show: boolean;
    count: number;
    sIntensity: number;
    nIntensity: number;
    grayscale: false;
  };
  static: {
    show: boolean;
    amount: number;
    size: number;
  };
  hue: {
    show: boolean;
    hue: number;
    saturation: number;
  };
}

export interface ConfigType {
  scene: {
    bgColor: string;
    background: string;
    blur: number;
    brightness: number;
    shader?: any;
    shader_speed?: number;
    shader_opacity?: number;
    shader_zoom?: number;
    shader_sin_cos_x?: boolean;
    shader_sin_cos_y?: boolean;
    shader_sin_cos_speed?: number;
    shader_sin_cos_space?: number;
    sparks?: boolean;
  };
  music: string;
  timer: {
    show: boolean;
    color: string;
    bgColor: boolean;
    opacity: number;
    order: number;
    width: number;
    height: number;
    size: number;
    font: string;
    align: string;
    x: number;
    y: number;
    z: number;
    rotationX: number;
    rotationY: number;
    rotationZ: number;
  };
  progressbar: {
    show: boolean;
    color: string;
    cursorColor: string;
    bgColor: boolean;
    opacity: number;
    order: number;
    width: number;
    height: number;
    x: number;
    y: number;
    z: number;
    rotationX: number;
    rotationY: number;
    rotationZ: number;
  };
  vumeters: {
    oscilloscop: {
      show: boolean;
      color: string;
      bgColor: boolean;
      motionBlur: boolean;
      motionBlurLength: number;
      opacity: number;
      order: number;
      width: number;
      height: number;
      x: number;
      y: number;
      z: number;
      rotationX: number;
      rotationY: number;
      rotationZ: number;
    };
    spectrum: {
      show: boolean;
      color: string | boolean;
      bgColor: string | boolean;
      multiColor: boolean;
      centerSpectrum: boolean;
      motionBlur: boolean;
      motionBlurLength: number;
      opacity: number;
      order: number;
      bars: number;
      width: number;
      height: number;
      x: number;
      y: number;
      z: number;
      zoom: number;
      rotationX: number;
      rotationY: number;
      rotationZ: number;
    };
  };
  composer: any;
  images?: ImageType[];
  texts?: TextType[];
}
