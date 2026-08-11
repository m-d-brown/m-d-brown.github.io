import { readdirSync, readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Builds a slug -> last-modified date table for the sitemap's <lastmod>, which
// tells crawlers a page changed and is worth re-fetching.
//
// Why parse frontmatter by hand: @astrojs/sitemap runs as an integration, and
// integrations can't call getCollection() — so the dates that
// src/content.config.ts already validated aren't reachable from here. This
// re-reads them independently. That makes it a SECOND source of truth: if
// frontmatter formatting drifts past these regexes, a page silently loses its
// lastmod rather than failing the build. If that ever bites, replace the
// integration with a src/pages/sitemap.xml.ts endpoint, which can use
// getCollection() directly.
// Resolved against this config file, not the working directory, so the path
// holds no matter where `npm run build` runs from.
const WRITEUPS = new URL('./src/content/writeups/', import.meta.url);
const lastmodBySlug = new Map();
for (const file of readdirSync(WRITEUPS)) {
  // Skips the images/ subdirectory as well as any non-markdown stragglers.
  if (!file.endsWith('.md')) continue;
  // Frontmatter is the chunk between the opening and closing `---`; index [1]
  // is that block, [2] onward is the body, which we don't care about.
  const frontmatter = readFileSync(new URL(file, WRITEUPS), 'utf8').split(
    '---'
  )[1];
  if (!frontmatter) continue;
  // Prefer `updated` (post was revised), else fall back to the publish `date`.
  // `^` plus the /m flag anchors to line starts, so a "date:" mentioned inside
  // a description can't match.
  const stamp = (
    frontmatter.match(/^updated:\s*"?(\d{4}-\d{2}-\d{2})/m) ??
    frontmatter.match(/^date:\s*"?(\d{4}-\d{2}-\d{2})/m)
  )?.[1];
  // Filename is the slug: time_machine_uchg_smb.md -> time_machine_uchg_smb.
  if (stamp) lastmodBySlug.set(file.replace(/\.md$/, ''), stamp);
}

export default defineConfig({
  // Read by Astro.site and used to build absolute URLs (canonical, og:, RSS,
  // sitemap). Getting it wrong silently poisons all of them.
  site: 'https://mdbrown.dev',
  integrations: [
    // Emits extensionless URLs, which already match our internal links and
    // <link rel="canonical"> despite `build.format: 'file'`.
    sitemap({
      // The markdown style-test page is a dev aid, not content worth indexing.
      filter: (page) => !/\/style(\.html)?$/.test(page),
      // Runs once per sitemap entry, and is where the table above gets used.
      serialize: (item) => {
        // https://mdbrown.dev/time_machine_uchg_smb -> time_machine_uchg_smb
        const slug = new URL(item.url).pathname.replace(/^\/|\/$/g, '');
        const stamp = lastmodBySlug.get(slug);
        // Non-writeups (/, /about) aren't in the table and get no lastmod,
        // which is valid — the element is optional.
        return stamp ? { ...item, lastmod: `${stamp}T00:00:00.000Z` } : item;
      },
    }),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: false,
    },
  },
  build: {
    // 'file' emits foo.html; the default 'directory' would emit foo/index.html.
    // Kept for parity with the old Jekyll URLs — see README. This choice is why
    // the layout strips ".html" for canonicals and why the RSS feed sets
    // trailingSlash: false.
    format: 'file',
  },
});
