import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react({
      babel: {
        parserOpts: {
          plugins: ['decorators-legacy', 'classProperties']
        }
      }
    })
  ],

  esbuild: {
    loader: 'tsx',
    include: /src\/.*\.[tj]sx?$/,
    exclude: []
  },

  optimizeDeps: {
    include: [
      'react', 'react-dom', 'three', '@tweenjs/tween.js',
      'rsuite', '@rsuite/icons', 'react-device-detect',
      'react-use-keypress', 'dat.gui'
    ],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },

  server: {
    port: 3000,
    open: true
  },

  build: {
    outDir: 'build',
    sourcemap: true,
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-three': ['three'],
          'vendor-ui': ['rsuite', '@rsuite/icons'],
          'vendor-tween': ['@tweenjs/tween.js']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild'
  },

  publicDir: 'public'
})
