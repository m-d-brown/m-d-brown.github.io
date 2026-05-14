import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://mdbrown.dev',
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: false,
    },
  },
  build: {
    format: 'file',
  },
});
