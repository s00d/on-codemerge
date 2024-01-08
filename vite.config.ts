import path from 'path';
import { defineConfig } from "vite";

export default defineConfig({
  root: './src',
  base: '/on-codemerge',
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
