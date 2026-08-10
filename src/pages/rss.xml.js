import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

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
