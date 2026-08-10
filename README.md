# mdbrown.dev

Personal site at <https://mdbrown.dev> — an index of writeups on home
automation, networking, and other tinkering.

## Stack

- **[Astro](https://astro.build) 5** — static site generator. Outputs plain
  HTML, ships zero JS by default.
- **Markdown** content via Astro's
  [content collections](https://docs.astro.build/en/guides/content-collections/).
- **SCSS** for styling (single file, `src/styles/global.scss`).
- **[Shiki](https://shiki.style)** (Astro built-in) for syntax highlighting,
  theme `github-dark`. Configured in [astro.config.mjs](astro.config.mjs).
- **GitHub Pages** for hosting, deployed via GitHub Actions.
- **Cloudflare** in front of the domain. Web Analytics is enabled via
  Cloudflare's **Automatic Setup** (HTML rewriting at the edge) — no analytics
  script in this repo.

## Layout

```
.
├── astro.config.mjs                # site URL, Shiki theme, build format
├── package.json                    # npm scripts: dev, build, preview
├── src/
│   ├── content.config.ts           # `writeups` collection schema (zod)
│   ├── content/writeups/*.md       # one markdown file per writeup
│   ├── content/writeups/images/    # post images; optimized by Astro
│   ├── layouts/Default.astro       # shared layout (head, meta, JSON-LD)
│   ├── pages/
│   │   ├── index.astro             # home page; auto-lists writeups
│   │   ├── [slug].astro            # dynamic route → renders each writeup
│   │   ├── about.astro             # author page (referenced by JSON-LD)
│   │   ├── 404.astro               # not-found page
│   │   ├── rss.xml.js              # RSS feed
│   │   └── style.md                # markdown style-test page
│   └── styles/
│       ├── global.scss
│       └── print.css
├── public/                         # copied verbatim into the build output
│   ├── CNAME                       # GitHub Pages custom domain
│   ├── robots.txt                  # points crawlers at the sitemap
│   └── assets/fonts/               # self-hosted Chivo subset
└── .github/workflows/pages.yml     # build + deploy via withastro/action
```

## URL conventions

- Filename in `src/content/writeups/` is the slug. `home_assistant_dumb_ac.md` →
  `/home_assistant_dumb_ac`.
- `build.format: 'file'` in [astro.config.mjs](astro.config.mjs) keeps URLs
  matching the old Jekyll output (`/foo.html`, served extensionless by GitHub
  Pages). **Do not change this** — it preserves inbound links.

## Local development

Prerequisites: Node 20+ (we use 26), npm 10+.

```bash
npm install           # one-time, or after pulling new deps
npm run dev           # dev server with hot reload, default port 4321
npm run build         # produces ./dist/
npm run preview       # serves ./dist/ for a final smoke-test
```

Or via the Taskfile (also installs npm deps lazily):

```bash
task preview          # runs `npm run dev`
task build            # runs `npm run build`
```

[script/serve](script/serve) is a thin wrapper that kills any stale process on
the port before starting `npm run dev` — handy if you switch branches.

### Adding a writeup

1. Create `src/content/writeups/<slug>.md` with frontmatter:

   ```yaml
   ---
   title: "Display title for this writeup"
   date: 2026-05-14
   description:
     "50–165 characters. Becomes the search-result snippet and the link preview
     text, so write it for a human deciding whether to click."
   seoTitle: "Short title, ≤60 chars" # optional
   ---
   ```

   `date` is required and must be a real date (YYYY-MM-DD). `description` is
   also required — without one, search engines invent the snippet. `seoTitle` is
   optional: set it when `title` is too long to survive truncation in search
   results. The schema in [src/content.config.ts](src/content.config.ts)
   enforces all of this; the build fails if a field is missing or malformed.

2. Write markdown, starting at the first paragraph. **Don't open the file with
   an `# H1`** — [src/pages/\[slug\].astro](src/pages/[slug].astro) renders the
   `title` frontmatter as the page's single `<h1>`. Body headings start at `##`.
   Images go in `src/content/writeups/images/<slug>/` and are referenced
   **relatively** (`./images/<slug>/foo.jpg`) so Astro optimizes them —
   converting to WebP and emitting `width`/`height` and `loading="lazy"`. Paths
   under `/assets/img/` are copied verbatim and skip all of that.
3. Optionally set `image:` in frontmatter to a relative path (usually the post's
   first photo). It becomes the `og:image` link-preview card and the `image` in
   the page's JSON-LD.
4. The home page picks up the new entry automatically — no edit to
   [src/pages/index.astro](src/pages/index.astro) needed. Entries are sorted by
   `date` descending (newest first).

### Adding a one-off page (not a writeup)

Drop a `.md` or `.astro` file in `src/pages/`. See
[src/pages/style.md](src/pages/style.md) for the markdown form — it uses
`layout: ../layouts/Default.astro` in frontmatter.

## Deployment

Pushes to `main` trigger
[.github/workflows/pages.yml](.github/workflows/pages.yml), which runs
`withastro/action@v3` and publishes via `actions/deploy-pages@v4`.

> [!IMPORTANT] Repo Settings → Pages → Source must be **"GitHub Actions"** (not
> "Deploy from a branch").

## Linting

Pre-commit handles markdown / yaml / json formatting via
[.pre-commit-config.yaml](.pre-commit-config.yaml). Python venv is created
lazily by `task install-deps`.

## Useful references

- Astro docs: <https://docs.astro.build>
- Content collections: <https://docs.astro.build/en/guides/content-collections/>
- Shiki themes: <https://shiki.style/themes>
- GitHub Pages + Astro: <https://docs.astro.build/en/guides/deploy/github/>
