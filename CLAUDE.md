# Working in this repo

## Use Taskfile targets, not the underlying tools

`Taskfile.yml` is the interface for this repo. Prefer it over `npm`, `pip`, or
`pre-commit` invocations, even when the direct command looks equivalent — the
targets carry dependency and staleness checks (venv rebuilds, `npm install`,
hook installation) that the bare commands skip.

| Instead of                   | Run            |
| ---------------------------- | -------------- |
| `npm install`, `pip install` | `task setup`   |
| `npm run build`              | `task build`   |
| `npm run dev`                | `task preview` |
| `pre-commit run --all-files` | `task lint`    |
| formatting files in place    | `task format`  |

`task check-https` verifies the live redirect and TLS setup. That configuration
lives in Cloudflare and GitHub Pages, not in this repo, so nothing here can
catch a dashboard change that reverts it — run the target instead of assuming.

`task --list` shows everything. `task setup` is the single setup entry point and
is safe to re-run: every step has a status check, so a second run is a no-op.

`task lint` fails when a formatter rewrites a file; `task format` is the same
hooks run for their side effects, and only fails on what no hook can fix.

## Stay on the palette

Every colour and typeface on this site comes from the token block at the top of
`src/styles/global.scss` (§1 Design Tokens). That block is the whole scheme — if
a value isn't there, it isn't in the scheme.

- **Never write a literal colour in a rule.** No `#hex`, `rgb()`, `hsl()`, or
  named colours like `gray`. Same for fonts: use `$font-sans`, `$font-heading`,
  `$font-code`.
- **Reference the semantic role, not the raw swatch.** Prefer `$primary-text`,
  `$background`, `$accent`, `$secondary`, `$border-color` over `$ink-black`,
  `$alice-blue`, `$rich-cerulean`, `$orange`, `$taupe`. The semantic layer is
  the point of indirection; reaching past it to the swatch defeats it. `$taupe`
  is the one routinely used directly, as the muted-text colour.
- **Don't invent a tint to get a shade you want.** `rgba($primary-text, 0.75)`
  is a new colour that isn't in the palette. To de-emphasise text, use an
  existing token (`$taupe`) or let it inherit — do not dial down the alpha on a
  solid one.
- **Alpha on a token is for borders and background washes only**, which is the
  established idiom here: `rgba($border-color, 0.1–0.4)` for hairlines and
  rules, `rgba($secondary, 0.05)` for the table-header wash. Text colours stay
  solid.
- **Need a colour the palette lacks?** Add it to the token block with a semantic
  name and say so, rather than inlining it at the use site.

The home-page entry list is the worked example: title in `$accent` because it is
a link, date in `$taupe`, summary inheriting `$primary-text`. Three roles, three
existing tokens, no new values.

## Don't change these without being asked

- `build.format: 'file'` in `astro.config.mjs`. It keeps URLs matching the old
  Jekyll output (`/foo.html`, also served extensionless by GitHub Pages) and
  preserves inbound links. The layout's canonical-URL handling and the RSS
  feed's `trailingSlash: false` both exist to compensate for it.
- `site:` in `astro.config.mjs`. Every absolute URL on the site — canonical,
  `og:`, RSS, sitemap — is derived from it.

## Notes

- Adding a writeup means one markdown file in `src/content/writeups/`. The
  filename is the slug; the home page, RSS feed, and sitemap all pick it up from
  the collection. Frontmatter is validated by `src/content.config.ts`, so a
  malformed post fails the build rather than shipping.
- Prettier only covers markdown, YAML, and JSON. `.astro` and `.scss` are not
  auto-formatted — match the surrounding style by hand.
- Keep commit messages short. A conventional-commit subject line is usually the
  whole message; add a couple of lines of body only when the reason isn't
  obvious from the diff. Don't write essays.
- Inside a git worktree, `task lint` and `task format` fail: they depend on
  `pre-commit install`, which refuses to run while `core.hooksPath` is set, and
  worktree configs set it. The hooks themselves are fine — run
  `./.venv/bin/pre-commit run --all-files` directly there. Don't "fix" it by
  unsetting `core.hooksPath`; that is the worktree's own config.
