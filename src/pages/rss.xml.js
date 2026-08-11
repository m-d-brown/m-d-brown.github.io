// A page that returns data instead of HTML. Astro strips the final `.js` from
// the filename, so `rss.xml.js` is served at /rss.xml — the extension is part
// of the route, not just a naming convention.
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

// Endpoints export a function named for the HTTP method. `context` carries the
// same values as Astro.* in a component — context.site is the config's `site`.
export async function GET(context) {
  const writeups = await getCollection('writeups');
  writeups.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return rss({
    title: 'mdbrown.dev',
    description:
      'Writeups by Matt Brown on home automation, networking, and repair.',
    site: context.site,
    // Without this, item links get a trailing slash ("/foo/"), which 404s:
    // `build.format: 'file'` emits foo.html, not foo/index.html.
    trailingSlash: false,
    items: writeups.map((w) => ({
      title: w.data.title,
      description: w.data.description,
      pubDate: w.data.date,
      // Extensionless, matching the canonical URLs.
      link: `/${w.id}`,
    })),
    customData: '<language>en-us</language>',
  });
}
