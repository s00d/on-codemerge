import path from 'path';
import { defineConfig } from "vite";
import svgLoader from 'vite-svg-loader'

export default defineConfig({
  root: './src',
  base: '/on-codemerge',
  plugins: [svgLoader({
    defaultImport: 'raw'
  })],
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        dir: `docs/`,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@root': path.resolve(__dirname, './'),
    },
  },
})
