import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const writeups = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writeups' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    // Used for <meta name="description"> and og:description. Required: a
    // missing description means search engines invent the snippet for us.
    description: z.string().min(50).max(165),
    // Optional short form of `title` for the <title> tag only. Set it when
    // `title` would be truncated in search results (~60 chars incl. suffix).
    seoTitle: z.string().max(60).optional(),
  }),
});

export const collections = { writeups };
