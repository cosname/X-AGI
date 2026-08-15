import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.x-agi.cc',
  output: 'static',
  trailingSlash: 'always',
  build: {
    assets: '_assets',
    format: 'directory',
  },
});
