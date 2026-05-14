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
│   ├── layouts/Default.astro       # shared layout (head, header, footer)
│   ├── pages/
│   │   ├── index.astro             # home page; auto-lists writeups
│   │   ├── [slug].astro            # dynamic route → renders each writeup
│   │   └── style.md                # markdown style-test page
│   └── styles/
│       ├── global.scss
│       └── print.css
├── public/                         # copied verbatim into the build output
│   ├── CNAME                       # GitHub Pages custom domain
│   └── assets/img/                 # images referenced from posts
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
   ---
   ```
2. Write markdown. Images go in `public/assets/img/<slug>/` and are referenced
   as `/assets/img/<slug>/foo.jpg`.
3. The home page picks up the new entry automatically — no edit to
   [src/pages/index.astro](src/pages/index.astro) needed. (Entries are sorted by
   title.)

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
