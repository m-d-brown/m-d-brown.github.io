import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://mdbrown.dev',
  integrations: [
    // Emits extensionless URLs, which already match our internal links and
    // <link rel="canonical"> despite `build.format: 'file'`.
    sitemap({
      // The markdown style-test page is a dev aid, not content worth indexing.
      filter: (page) => !/\/style(\.html)?$/.test(page),
    }),
  ],
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
