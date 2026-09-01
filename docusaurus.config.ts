import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'BlackwallDocs',
  tagline: 'Multi-host modular NixOS network documentation',
  favicon: 'img/favicon.ico',

  url: 'https://docs.blackwall.cam',
  baseUrl: '/',

  organizationName: 'tmangan64',
  projectName: 'BlackwallDocs',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          id: 'blackwall',
          path: 'blackwall',
          routeBasePath: 'blackwall',
          sidebarPath: './sidebarsBlackwall.ts',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'development',
        path: 'development',
        routeBasePath: 'development',
        sidebarPath: './sidebarsDevelopment.ts',
      },
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'BlackwallDocs',
      items: [
        {
          type: 'doc',
          docId: 'intro',
          docsPluginId: 'blackwall',
          position: 'left',
          label: 'Blackwall',
        },
        {
          type: 'doc',
          docId: 'intro',
          docsPluginId: 'development',
          position: 'left',
          label: 'Development',
        },
        {
          href: 'https://github.com/tmangan64/BlackwallDocs',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
