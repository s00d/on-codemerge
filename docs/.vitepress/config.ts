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
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Styles', link: '/styles' },
      { text: 'Core', link: '/core' },
      { text: 'Plugin Development', link: '/plugin-development-guide' },
      { text: 'Integrations', link: '/integrations' }
    ],

    sidebar: [
      {
        text: 'Docs',
        items: [
          { text: 'Docs', link: '/' },
          { text: 'Styles', link: '/styles' },
          { text: 'Core', link: '/core' },
          { text: 'Plugin Development', link: '/plugin-development-guide' },
        ]
      },
      {
        text: 'Integrations',
        items: [
          { text: 'Angular', link: '/integrations/angular' },
          { text: 'Backbone.js', link: '/integrations/backbone' },
          { text: 'Django', link: '/integrations/django' },
          { text: 'Electron', link: '/integrations/electron' },
          { text: 'Express', link: '/integrations/express' },
          { text: 'Laravel', link: '/integrations/laravel' },
          { text: 'Next.js', link: '/integrations/next' },
          { text: 'Nuxt.js 3', link: '/integrations/nuxt' },
          { text: 'Rails', link: '/integrations/rails' },
          { text: 'React', link: '/integrations/react' },
          { text: 'Slim', link: '/integrations/slim' },
          { text: 'Spring', link: '/integrations/spring' },
          { text: 'Symfony', link: '/integrations/symfony' },
          { text: 'Vue 2', link: '/integrations/vue2' },
          { text: 'Vue 3', link: '/integrations/vue3' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/s00d/on-codemerge' }
    ]
  }
})
