import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'en-US',
  title: "OnCodemerge Docs",
  description: "A WYSIWYG editor for on-codemerge",
  lastUpdated: true,
  cleanUrls: true,
  base: process.env.NODE_ENV === 'production' ? '/on-codemerge/' : '/',
  themeConfig: {
    search: {
      provider: 'local',
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Core', link: '/core' },
      { text: 'Styles', link: '/styles' },
      {
        text: 'Plugins',
        items: [
          { text: 'Overview', link: '/plugins/' },
          { text: 'Toolbar Plugin', link: '/plugins/toolbar-plugin' },
          { text: 'Toolbar Divider Plugin', link: '/plugins/toolbar-divider-plugin' },
          { text: 'Font Plugin', link: '/plugins/font-plugin' },
          { text: 'Typography Plugin', link: '/plugins/typography-plugin' },
          { text: 'Color Plugin', link: '/plugins/color-plugin' },
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
        ],
      },
      {
        text: 'Integrations',
        items: [
          { text: 'Overview', link: '/integrations/' },
          { text: 'React', link: '/integrations/react' },
          { text: 'Vue 2', link: '/integrations/vue2' },
          { text: 'Vue 3', link: '/integrations/vue3' },
          { text: 'Angular', link: '/integrations/angular' },
          { text: 'Backbone.js', link: '/integrations/backbone' },
          { text: 'Express.js', link: '/integrations/express' },
          { text: 'Django', link: '/integrations/django' },
          { text: 'Ruby on Rails', link: '/integrations/rails' },
          { text: 'Laravel', link: '/integrations/laravel' },
          { text: 'Spring Boot', link: '/integrations/spring' },
          { text: 'Symfony', link: '/integrations/symfony' },
          { text: 'Slim', link: '/integrations/slim' },
          { text: 'Next.js', link: '/integrations/next' },
          { text: 'Nuxt.js 3', link: '/integrations/nuxt' },
          { text: 'Python Flask', link: '/integrations/python-flask' },
          { text: 'Go Gin', link: '/integrations/go-gin' },
          { text: 'Rust Actix-web', link: '/integrations/rust-actix' },
          { text: 'Kotlin Spring Boot', link: '/integrations/kotlin-spring' },
          { text: 'Flutter', link: '/integrations/flutter' },
          { text: 'Electron', link: '/integrations/electron' },
        ],
      },
      { text: 'Plugin Development', link: '/plugin-development-guide' },
    ],

    sidebar: {
      '/': [
        {
          text: 'Documentation',
          items: [
            { text: 'Introduction', link: '/' },
            { text: 'Core', link: '/core' },
            { text: 'Plugin Development', link: '/plugin-development-guide' },
          ]
        },
      ],
      '/plugins/': [
        {
          text: 'Plugins',
          items: [
            { text: 'Overview', link: '/plugins/' },
            { text: 'Toolbar Plugin', link: '/plugins/toolbar-plugin' },
            { text: 'Toolbar Divider Plugin', link: '/plugins/toolbar-divider-plugin' },
            { text: 'Font Plugin', link: '/plugins/font-plugin' },
            { text: 'Typography Plugin', link: '/plugins/typography-plugin' },
            { text: 'Color Plugin', link: '/plugins/color-plugin' },
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
          ]
        }
      ],
      '/integrations/': [
        {
          text: 'Integrations',
          items: [
            { text: 'Overview', link: '/integrations/' },
            { text: 'React', link: '/integrations/react' },
            { text: 'Vue 2', link: '/integrations/vue2' },
            { text: 'Vue 3', link: '/integrations/vue3' },
            { text: 'Angular', link: '/integrations/angular' },
            { text: 'Backbone.js', link: '/integrations/backbone' },
            { text: 'Express.js', link: '/integrations/express' },
            { text: 'Django', link: '/integrations/django' },
            { text: 'Ruby on Rails', link: '/integrations/rails' },
            { text: 'Laravel', link: '/integrations/laravel' },
            { text: 'Spring Boot', link: '/integrations/spring' },
            { text: 'Symfony', link: '/integrations/symfony' },
            { text: 'Slim', link: '/integrations/slim' },
            { text: 'Next.js', link: '/integrations/next' },
            { text: 'Nuxt.js 3', link: '/integrations/nuxt' },
            { text: 'Python Flask', link: '/integrations/python-flask' },
            { text: 'Go Gin', link: '/integrations/go-gin' },
            { text: 'Rust Actix-web', link: '/integrations/rust-actix' },
            { text: 'Kotlin Spring Boot', link: '/integrations/kotlin-spring' },
            { text: 'Flutter', link: '/integrations/flutter' },
            { text: 'Electron', link: '/integrations/electron' },
          ]
        }
      ]
    },

    editLink: {
      pattern: 'https://github.com/s00d/on-codemerge/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the MIT License.',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/s00d/on-codemerge' }
    ]
  }
})
