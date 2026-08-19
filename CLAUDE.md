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

`task --list` shows everything. `task setup` is the single setup entry point and
is safe to re-run: every step has a status check, so a second run is a no-op.

`task lint` fails when a formatter rewrites a file; `task format` is the same
hooks run for their side effects, and only fails on what no hook can fix.

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
- Inside a git worktree, `task lint` and `task format` fail: they depend on
  `pre-commit install`, which refuses to run while `core.hooksPath` is set, and
  worktree configs set it. The hooks themselves are fine — run
  `./.venv/bin/pre-commit run --all-files` directly there. Don't "fix" it by
  unsetting `core.hooksPath`; that is the worktree's own config.
