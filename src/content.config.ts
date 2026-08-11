// Defines the `writeups` collection: which files belong to it and what shape
// their frontmatter must have. Astro validates every file against this at build
// time, so a malformed post fails the build instead of shipping broken.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const writeups = defineCollection({
  // Finds the markdown. Each file's path relative to `base`, minus the
  // extension, becomes its `id` — which this site also uses as the URL slug.
  loader: glob({ pattern: '**/*.md', base: './src/content/writeups' }),
  // The schema is written as a FUNCTION rather than a plain object purely to
  // get the `image()` helper below. Astro passes it in; there's no other way to
  // reach it. Without a field using image(), `schema: z.object({...})` is fine.
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      // `coerce` turns whatever YAML produces (string or Date) into a real
      // Date, so pages can call .toISOString() without checking the type.
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
      // image() validates the path AND hands the page an ImageMetadata object
      // (dimensions, format) rather than a bare string, which is what lets
      // getImage()/<Image /> optimize it. Paths are relative to the .md file.
      image: image().optional(),
    }),
});

// Astro looks for this exact export. The key is the collection name used in
// getCollection('writeups').
export const collections = { writeups };
