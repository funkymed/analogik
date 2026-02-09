/// <reference types="vite/client" />

declare global {
  interface Window {
    ChiptuneJsPlayer: any;
    ChiptuneJsConfig: any;
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
  }
}

// Asset type declarations
declare module '*.png' { const value: string; export default value; }
declare module '*.jpg' { const value: string; export default value; }
declare module '*.css' { const content: { [className: string]: string }; export default content; }

export {};
