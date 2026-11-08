import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import svgLoader from 'vite-svg-loader';
import { ocmPluginAliases } from '../scripts/ocm-plugin-aliases.ts';
import { ocmPackageIndexCssPlugin } from '../scripts/vite-plugin-ocm-package-index-css.ts';
import { scssPreprocessorOptions } from '../scripts/scss-vite-options.ts';
import { docsDevApiPlugin } from './dev-api/plugin.ts';

const root = resolve(import.meta.dirname, '..');

// GitHub Pages serves the site from https://s00d.github.io/on-codemerge/.
const baseURL =
  process.env.NUXT_APP_BASE_URL ?? (process.env.NODE_ENV === 'production' ? '/on-codemerge/' : '/');

// VitePress-era URLs (`/guide/editors`, `/plugins/color-plugin`, …) still linked from older
// READMEs on npm: prerender a redirect page for each.
const redirects: Record<string, string> = JSON.parse(
  readFileSync(resolve(import.meta.dirname, 'redirects.json'), 'utf8')
);

export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/content'],

  // Prebuilt editor CSS (Tailwind-scanned at package build). Processing the
  // editor SCSS through the docs pipeline would miss ViewSpec classes.
  css: ['~/assets/css/main.css', resolve(root, 'dist/index.css'), resolve(root, 'dist/public.css')],

  app: {
    baseURL,
    head: {
      htmlAttrs: { lang: 'en' },
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: `${baseURL}favicon.svg` },
        { rel: 'icon', href: `${baseURL}favicon.ico`, sizes: 'any' },
        { rel: 'apple-touch-icon', href: `${baseURL}apple-touch-icon.png` },
      ],
    },
  },

  // Live demos import the editor straight from workspace sources.
  alias: {
    '@codemerge/kernel': resolve(root, 'packages/kernel/src'),
    '@codemerge/sdk/sdk.css': resolve(root, 'packages/sdk/dist/sdk.css'),
    '@codemerge/sdk': resolve(root, 'packages/sdk/src'),
    '@codemerge/editor': resolve(root, 'packages/editor/src'),
    '@codemerge/hunspell': resolve(root, 'packages/hunspell/src'),
    '@codemerge/view': resolve(root, 'packages/view/src'),
    '@codemerge/mermaid': resolve(root, 'packages/mermaid/src'),
    '@codemerge/wysiwyg': resolve(root, 'apps/wysiwyg/src'),
    '@ocm/wysiwyg': resolve(root, 'apps/wysiwyg/src'),
    ...ocmPluginAliases(root),
  },

  icon: {
    // Bundle every icon so the static site never asks the Iconify API at runtime.
    clientBundle: {
      scan: true,
      icons: [
        'simple-icons:typescript',
        'simple-icons:javascript',
        'simple-icons:vuedotjs',
        'simple-icons:html5',
        'simple-icons:json',
        'simple-icons:markdown',
        'simple-icons:nodedotjs',
        'simple-icons:python',
        'simple-icons:php',
        'simple-icons:go',
        'simple-icons:rust',
        'lucide:terminal',
        'lucide:file-code',
        // Section icons from content/**/.navigation.yml (not seen by the scanner).
        'lucide:rocket',
        'lucide:layout-panel-left',
        'lucide:puzzle',
        'lucide:type',
        'lucide:blocks',
        'lucide:image',
        'lucide:database',
        'lucide:users',
        'lucide:wrench',
        'lucide:plug',
        'lucide:book-open',
        'lucide:monitor',
        'lucide:layers',
        'lucide:coffee',
        'lucide:smartphone',
        'lucide:cpu',
        'simple-icons:npm',
        'simple-icons:github',
      ],
      sizeLimitKb: 512,
    },
  },

  colorMode: {
    preference: 'system',
  },

  content: {
    build: {
      markdown: {
        toc: { depth: 3, searchDepth: 2 },
        highlight: {
          langs: [
            'ts',
            'js',
            'tsx',
            'jsx',
            'vue',
            'svelte',
            'astro',
            'html',
            'css',
            'json',
            'bash',
            'shell',
            'yaml',
            'diff',
            'md',
            'http',
            'blade',
          ],
        },
      },
    },
    experimental: {
      // node:sqlite (Node 22.5+): no native better-sqlite3 build.
      sqliteConnector: 'native',
    },
  },

  vite: {
    assetsInclude: ['**/*.aff', '**/*.dic'],
    plugins: [
      // DEV-only /api/media|/api/files|/api/md-preview — configureServer only (not in static output).
      docsDevApiPlugin(),
      svgLoader({ defaultImport: 'raw', svgoConfig: { multipass: true } }),
      ocmPackageIndexCssPlugin(root),
    ],
    css: {
      preprocessorOptions: {
        scss: scssPreprocessorOptions,
      },
    },
  },

  routeRules: Object.fromEntries(
    Object.entries(redirects).map(([from, to]) => [
      from,
      { redirect: { to: `${baseURL.replace(/\/$/, '')}${to}`, statusCode: 301 } },
    ])
  ),

  nitro: {
    prerender: {
      // `/plugins/media/image.html`, not `/plugins/media/image/index.html`: GitHub Pages
      // serves it without a redirect to the trailing-slash URL.
      autoSubfolderIndex: false,
      crawlLinks: true,
      failOnError: true,
      routes: ['/', ...Object.keys(redirects)],
    },
  },

  compatibilityDate: '2025-11-03',
});
