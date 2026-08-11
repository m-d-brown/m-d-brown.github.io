import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const writeups = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writeups' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      // Set when a post is revised after publication. Shown on the page and
      // used for the sitemap's <lastmod>, which is a recrawl signal.
      updated: z.coerce.date().optional(),
      // Used for <meta name="description"> and og:description. Required: a
      // missing description means search engines invent the snippet for us.
      description: z.string().min(50).max(165),
      // Optional short form of `title` for the <title> tag only. Set it when
      // `title` would be truncated in search results (~60 chars incl. suffix).
      seoTitle: z.string().max(60).optional(),
      // Lead image for link previews (og:image). Usually the post's first
      // photo. Optional — posts without one get a text-only preview card.
      image: image().optional(),
    }),
});

export const collections = { writeups };
