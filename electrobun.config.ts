import { defineConfig } from 'electrobun';

export default defineConfig({
  productName: 'Analogik',
  appId: 'com.mandarine.analogik',
  buildResources: 'public',
  main: {
    entry: 'src/index.js'
  },
  renderer: {
    entry: 'index.html'
  },
  mac: {
    target: ['universal'],
    icon: 'public/logo512.png'
  },
  win: {
    target: ['nsis'],
    icon: 'public/logo512.png'
  },
  linux: {
    target: ['AppImage'],
    icon: 'public/logo512.png'
  }
});
