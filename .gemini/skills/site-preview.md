---
name: site-preview
description:
  Start the site preview server for local development and testing. Use this
  skill whenever you need to verify UI changes, check links, or view the site's
  current state. This skill is optimized for the repository's Ruby 4.0
  requirement.
---

# Site Preview Skill

This local skill provides the "ground truth" for starting the development server
for `m-d-brown.github.io`.

## Environment Requirements

- **Ruby**: This project requires Ruby 4.0.2+.
- **Path**: On this system, the correct Ruby is located at
  `/opt/homebrew/opt/ruby/bin/ruby`.
- **Port**: The default port is **4001**.

## Primary Workflow

ALWAYS use the task runner to start the server:

```bash
task preview
```

This task automatically handles the `PATH` setup and starts Jekyll with
`--livereload`.

## Manual Fallback

If the task fails, you can run the following manually:

```bash
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
bundle exec jekyll serve --port 4001 --livereload
```

## Verification

1. Once the server is running, access it at `http://127.0.0.1:4001/`.
2. Use the `browser_subagent` tool to verify the site is rendering correctly.
