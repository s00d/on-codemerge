import { defineConfig } from 'vitepress';
import { resolve } from 'node:path';
import svgLoader from 'vite-svg-loader';
import tailwindcss from '@tailwindcss/vite';
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
  { text: 'Chrome & host', link: '/integrate/chrome-and-host' },
  { text: 'React', link: '/integrate/react' },
  { text: 'Vue 3', link: '/integrate/vue3' },
  { text: 'Next.js', link: '/integrate/next' },
];

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/on-codemerge/' : '/',
  cleanUrls: true,
  description: 'Virtual document WYSIWYG editor',
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
    ],
    resolve: {
      alias: {
        '@codemerge/kernel': resolve(root, 'packages/kernel/src'),
        '@codemerge/sdk': resolve(root, 'packages/sdk/src'),
        '@codemerge/editor': resolve(root, 'packages/editor/src'),
        '@codemerge/hunspell': resolve(root, 'packages/hunspell/src'),
        '@codemerge/view': resolve(root, 'packages/view/src'),
        '@codemerge/mermaid': resolve(root, 'packages/mermaid/src'),
        '@ocm/wysiwyg': resolve(root, 'apps/wysiwyg/src'),
        '@ocm/plugins': resolve(root, 'plugins'),
      },
    },
    css: {
      preprocessorOptions: {
        scss: scssPreprocessorOptions,
      },
    },
  },
});
