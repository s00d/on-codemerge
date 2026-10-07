import { defineConfig } from 'vitepress';
import { resolve } from 'node:path';
import svgLoader from 'vite-svg-loader';
import tailwindcss from '@tailwindcss/vite';
import { ocmPluginAliases } from '../../scripts/ocm-plugin-aliases.ts';
import { ocmPackageIndexCssPlugin } from '../../scripts/vite-plugin-ocm-package-index-css.ts';
import { scssPreprocessorOptions } from '../../scripts/scss-vite-options.ts';
import { docsDevApiPlugin } from './dev-api/plugin.ts';

const root = resolve(import.meta.dirname, '../..');

const pluginSidebar = [
  { text: 'Overview', link: '/plugins/' },
  { text: 'Default marks (ToolbarPlugin)', link: '/plugins/toolbar-plugin' },
  { text: 'Font Plugin', link: '/plugins/font-plugin' },
  { text: 'Typography Plugin', link: '/plugins/typography-plugin' },
  { text: 'Color Plugin', link: '/plugins/color-plugin' },
  { text: 'Clear Styles Plugin', link: '/plugins/clear-styles-plugin' },
  { text: 'Alignment Plugin', link: '/plugins/alignment-plugin' },
  { text: 'Block Style Plugin', link: '/plugins/block-style-plugin' },
  { text: 'Block Plugin', link: '/plugins/block-plugin' },
  { text: 'Lists Plugin', link: '/plugins/lists-plugin' },
  { text: 'Table Plugin', link: '/plugins/table-plugin' },
  { text: 'Templates Plugin', link: '/plugins/templates-plugin' },
  { text: 'Image Plugin', link: '/plugins/image-plugin' },
  { text: 'Video Plugin', link: '/plugins/video-plugin' },
  { text: 'YouTube Video Plugin', link: '/plugins/youtube-video-plugin' },
  { text: 'File Upload Plugin', link: '/plugins/file-upload-plugin' },
  { text: 'Code Block Plugin', link: '/plugins/code-block-plugin' },
  { text: 'JSON Plugin', link: '/plugins/json-plugin' },
  { text: 'Markdown Plugin', link: '/plugins/markdown-plugin' },
  { text: 'Math Plugin', link: '/plugins/math-plugin' },
  { text: 'HTML Viewer Plugin', link: '/plugins/html-viewer-plugin' },
  { text: 'Link Plugin', link: '/plugins/link-plugin' },
  { text: 'Charts Plugin', link: '/plugins/charts-plugin' },
  { text: 'Form Builder Plugin', link: '/plugins/form-builder-plugin' },
  { text: 'Collaboration Plugin', link: '/plugins/collaboration-plugin' },
  { text: 'Comments Plugin', link: '/plugins/comments-plugin' },
  { text: 'Footnotes Plugin', link: '/plugins/footnotes-plugin' },
  { text: 'History Plugin', link: '/plugins/history-plugin' },
  { text: 'Export Plugin', link: '/plugins/export-plugin' },
  { text: 'Shortcuts Plugin', link: '/plugins/shortcuts-plugin' },
  { text: 'Responsive Plugin', link: '/plugins/responsive-plugin' },
  { text: 'Language Plugin', link: '/plugins/language-plugin' },
  { text: 'Spell Checker Plugin', link: '/plugins/spell-checker-plugin' },
  { text: 'AI Assistant Plugin', link: '/plugins/ai-assistant-plugin' },
  { text: 'Footer Plugin', link: '/plugins/footer-plugin' },
  { text: 'Calendar Plugin', link: '/plugins/calendar-plugin' },
  { text: 'Timer Plugin', link: '/plugins/timer-plugin' },
  { text: 'PDF Embed Plugin', link: '/plugins/pdf-embed-plugin' },
  { text: 'Mentions Plugin', link: '/plugins/mentions-plugin' },
  { text: 'Track Changes Plugin', link: '/plugins/track-changes-plugin' },
  { text: 'Anchor Link Plugin', link: '/plugins/anchor-link-plugin' },
];

const integrateSidebar = [
  { text: 'Overview', link: '/integrate/' },
  {
    text: 'Chrome & host',
    link: '/integrate/chrome-and-host',
  },
  {
    text: 'Frontend',
    items: [
      { text: 'React', link: '/integrate/react' },
      { text: 'Vue 2', link: '/integrate/vue2' },
      { text: 'Vue 3', link: '/integrate/vue3' },
      { text: 'Angular', link: '/integrate/angular' },
      { text: 'Svelte', link: '/integrate/svelte' },
      { text: 'Solid.js', link: '/integrate/solid' },
      { text: 'Preact', link: '/integrate/preact' },
      { text: 'Lit', link: '/integrate/lit' },
      { text: 'Qwik', link: '/integrate/qwik' },
      { text: 'jQuery', link: '/integrate/jquery' },
      { text: 'Alpine.js', link: '/integrate/alpine' },
      { text: 'Backbone.js', link: '/integrate/backbone' },
    ],
  },
  {
    text: 'Meta-frameworks',
    items: [
      { text: 'Next.js', link: '/integrate/next' },
      { text: 'Nuxt 3 / 4', link: '/integrate/nuxt' },
      { text: 'SvelteKit', link: '/integrate/sveltekit' },
      { text: 'Remix', link: '/integrate/remix' },
      { text: 'Astro', link: '/integrate/astro' },
    ],
  },
  {
    text: 'Backend — Node / edge',
    items: [
      { text: 'Express.js', link: '/integrate/express' },
      { text: 'NestJS', link: '/integrate/nestjs' },
      { text: 'Fastify', link: '/integrate/fastify' },
      { text: 'Hono', link: '/integrate/hono' },
      { text: 'Koa', link: '/integrate/koa' },
      { text: 'Bun', link: '/integrate/bun' },
      { text: 'Deno', link: '/integrate/deno' },
      { text: 'AdonisJS', link: '/integrate/adonis' },
    ],
  },
  {
    text: 'Backend — Python',
    items: [
      { text: 'FastAPI', link: '/integrate/fastapi' },
      { text: 'Django', link: '/integrate/django' },
      { text: 'Python Flask', link: '/integrate/python-flask' },
      { text: 'Litestar', link: '/integrate/litestar' },
    ],
  },
  {
    text: 'Backend — PHP',
    items: [
      { text: 'Laravel', link: '/integrate/laravel' },
      { text: 'Symfony', link: '/integrate/symfony' },
      { text: 'Slim', link: '/integrate/slim' },
      { text: 'CakePHP', link: '/integrate/cakephp' },
      { text: 'CodeIgniter', link: '/integrate/codeigniter' },
    ],
  },
  {
    text: 'Backend — Go',
    items: [
      { text: 'Go Gin', link: '/integrate/go-gin' },
      { text: 'Go Echo', link: '/integrate/go-echo' },
      { text: 'Go Fiber', link: '/integrate/go-fiber' },
      { text: 'Go Chi', link: '/integrate/go-chi' },
    ],
  },
  {
    text: 'Backend — Rust',
    items: [
      { text: 'Rust Axum', link: '/integrate/rust-axum' },
      { text: 'Rust Actix-web', link: '/integrate/rust-actix' },
      { text: 'Rust Rocket', link: '/integrate/rust-rocket' },
      { text: 'Rust Warp', link: '/integrate/rust-warp' },
      { text: 'Rust Poem', link: '/integrate/rust-poem' },
      { text: 'Rust Loco', link: '/integrate/rust-loco' },
    ],
  },
  {
    text: 'Backend — JVM / .NET / other',
    items: [
      { text: 'Spring Boot', link: '/integrate/spring' },
      { text: 'Quarkus', link: '/integrate/quarkus' },
      { text: 'Micronaut', link: '/integrate/micronaut' },
      { text: 'Kotlin Spring Boot', link: '/integrate/kotlin-spring' },
      { text: 'Ktor', link: '/integrate/ktor' },
      { text: 'ASP.NET Core', link: '/integrate/aspnet-core' },
      { text: 'Blazor', link: '/integrate/blazor' },
      { text: 'Phoenix', link: '/integrate/phoenix' },
      { text: 'Ruby on Rails', link: '/integrate/rails' },
      { text: 'HTMX host', link: '/integrate/htmx' },
    ],
  },
  {
    text: 'Hosts',
    items: [
      { text: 'Flutter', link: '/integrate/flutter' },
      { text: 'Electron', link: '/integrate/electron' },
      { text: 'Tauri', link: '/integrate/tauri' },
      { text: 'Wails', link: '/integrate/wails' },
      { text: 'Capacitor', link: '/integrate/capacitor' },
    ],
  },
];

const base = process.env.NODE_ENV === 'production' ? '/on-codemerge/' : '/';

export default defineConfig({
  base,
  cleanUrls: true,
  description: 'Virtual document WYSIWYG editor',
  head: [
    ['link', { rel: 'icon', href: `${base}favicon.svg`, type: 'image/svg+xml' }],
    ['link', { rel: 'icon', href: `${base}favicon.ico`, sizes: 'any' }],
    ['link', { rel: 'apple-touch-icon', href: `${base}apple-touch-icon.png` }],
  ],
  lang: 'en-US',
  lastUpdated: true,
  themeConfig: {
    editLink: {
      pattern: 'https://github.com/s00d/on-codemerge/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
    footer: {
      message: 'Released under the MIT License.',
    },
    logo: { src: '/favicon.svg', alt: 'on-CodeMerge' },
    nav: [
      { text: 'Home', link: '/' },
      {
        text: 'Guide',
        items: [
          { text: 'Editors', link: '/guide/editors' },
          { text: 'Editor API', link: '/guide/editor' },
          { text: 'JSON Editor', link: '/guide/json-editor' },
          { text: 'Markdown Editor', link: '/guide/markdown-editor' },
          { text: 'Code Editor', link: '/guide/code-editor' },
          { text: 'Forms Editor', link: '/guide/forms-editor' },
          { text: 'Charts Editor', link: '/guide/charts-editor' },
          { text: 'Calendar Editor', link: '/guide/calendar-editor' },
          { text: 'Tables Editor', link: '/guide/tables-editor' },
          { text: 'Mermaid', link: '/guide/mermaid' },
          { text: 'SDK reference', link: '/guide/sdk' },
          { text: 'View runtime', link: '/guide/view' },
          { text: 'Document model', link: '/guide/document-model' },
          { text: 'Authoring plugins', link: '/guide/authoring-plugins' },
          { text: 'Publishing packages', link: '/guide/publishing-packages' },
          { text: 'Migration v1 → v2', link: '/guide/migration-v1-to-v2' },
        ],
      },
      { text: 'Plugins', link: '/plugins/' },
      { text: 'Integrate', link: '/integrate/' },
    ],
    search: {
      provider: 'local',
    },
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Introduction', link: '/' },
            { text: 'Editors', link: '/guide/editors' },
            { text: 'Editor API', link: '/guide/editor' },
            { text: 'JSON Editor', link: '/guide/json-editor' },
            { text: 'Markdown Editor', link: '/guide/markdown-editor' },
            { text: 'Code Editor', link: '/guide/code-editor' },
            { text: 'Forms Editor', link: '/guide/forms-editor' },
            { text: 'Charts Editor', link: '/guide/charts-editor' },
            { text: 'Calendar Editor', link: '/guide/calendar-editor' },
            { text: 'Tables Editor', link: '/guide/tables-editor' },
            { text: 'Mermaid', link: '/guide/mermaid' },
            { text: 'SDK reference', link: '/guide/sdk' },
            { text: 'View runtime', link: '/guide/view' },
            { text: 'Document model', link: '/guide/document-model' },
            { text: 'Authoring plugins', link: '/guide/authoring-plugins' },
            { text: 'Publishing packages', link: '/guide/publishing-packages' },
            { text: 'Migration v1 → v2', link: '/guide/migration-v1-to-v2' },
            { text: 'Plugins overview', link: '/plugins/' },
            { text: 'Integrate', link: '/integrate/' },
          ],
        },
      ],
      '/plugins/': [
        {
          text: 'Plugins',
          items: pluginSidebar,
        },
      ],
      '/integrate/': integrateSidebar,
      '/': [
        {
          text: 'Documentation',
          items: [
            { text: 'Introduction', link: '/' },
            { text: 'Editors', link: '/guide/editors' },
            { text: 'Editor API', link: '/guide/editor' },
            { text: 'JSON Editor', link: '/guide/json-editor' },
            { text: 'Markdown Editor', link: '/guide/markdown-editor' },
            { text: 'Code Editor', link: '/guide/code-editor' },
            { text: 'Forms Editor', link: '/guide/forms-editor' },
            { text: 'Charts Editor', link: '/guide/charts-editor' },
            { text: 'Calendar Editor', link: '/guide/calendar-editor' },
            { text: 'Tables Editor', link: '/guide/tables-editor' },
            { text: 'Mermaid', link: '/guide/mermaid' },
            { text: 'SDK reference', link: '/guide/sdk' },
            { text: 'View runtime', link: '/guide/view' },
            { text: 'Document model', link: '/guide/document-model' },
            { text: 'Authoring plugins', link: '/guide/authoring-plugins' },
            { text: 'Publishing packages', link: '/guide/publishing-packages' },
            { text: 'Migration v1 → v2', link: '/guide/migration-v1-to-v2' },
            { text: 'Plugins overview', link: '/plugins/' },
            { text: 'Integrate', link: '/integrate/' },
          ],
        },
      ],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/s00d/on-codemerge' }],
  },
  title: 'OnCodemerge Docs',
  vite: {
    assetsInclude: ['**/*.aff', '**/*.dic'],
    plugins: [
      // DEV-only /api/media|/api/files|/api/md-preview — configureServer only (not in static build).
      docsDevApiPlugin(),
      // Vite 8 + VitePress SSR: @import "tailwindcss" fails via postcss-import alone.
      tailwindcss(),
      svgLoader({
        defaultImport: 'raw',
        svgoConfig: {
          multipass: true,
        },
      }),
      ocmPackageIndexCssPlugin(root),
    ],

    resolve: {
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
    },

    css: {
      preprocessorOptions: {
        scss: scssPreprocessorOptions,
      },
    },
  },
});
