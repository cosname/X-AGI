import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.x-agi.cc',
  output: 'static',
  trailingSlash: 'always',
  build: {
    assets: '_assets',
    format: 'directory',
  },
  redirects: {
    '/2026': '/',
    '/2026/about': '/about/',
    '/2026/schedule': '/schedule/',
    '/2026/poster': '/poster/',
    '/2026/guide': '/guide/',
    '/2026/register': '/register/',
    '/2026/speakers': '/schedule/',
    '/speakers': '/schedule/',
  },
});
