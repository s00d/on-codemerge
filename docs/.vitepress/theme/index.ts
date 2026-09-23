// https://vitepress.dev/guide/custom-theme
import { h } from 'vue';
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import './style.css';
// Prebuilt package CSS (Tailwind-scanned). Do NOT rely on processing src/*.scss
// through the docs Vite pipeline — content scan misses editor ViewSpec classes.
import '../../../dist/index.css';
import '../../../dist/public.css';

export default {
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
    }),
  enhanceApp() {
    // ...
  },
  extends: DefaultTheme,
} satisfies Theme;
