// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';
import path from "node:path";

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'on-codemerge',
  tagline: 'his text editor is a modular system that allows for extending functionality through plugins. The editor supports basic text editing features such as undo and redo, and it enables inserting and editing links and videos.',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://your-docusaurus-site.example.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/on-codemerge/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'on', // Usually your GitHub org/user name.
  projectName: 'on-codemerge', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [
    [
      'docusaurus-plugin-module-alias',
      {
        alias: {
          '@root': path.resolve(__dirname, '../'),
        },
      },
    ],
  ],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: 'on-codemerge',
        logo: {
          alt: 'on-codemerge Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Docs',
          },
          {to: 'docs/api', label: 'Api', position: 'left'},
          {to: 'docs/dev', label: 'Developing Plugins', position: 'left'},
          {to: 'docs/category/tutorial---integrations', label: 'Integrations', position: 'left'},

          {
            href: 'https://github.com/s00d/on-codemerge',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Docs',
                to: '/docs/intro',
              },
              {
                label: 'Api',
                to: '/docs/api',
              },
              {
                label: 'Dev',
                to: '/docs/dev',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/s00d/on-codemerge',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} on-codemerge, Inc. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
