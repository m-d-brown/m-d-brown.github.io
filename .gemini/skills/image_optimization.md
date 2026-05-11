# Image Optimization for m-d-brown.github.io

## When to Apply

Whenever images are being added to this repository (e.g. into `assets/img/`),
check their dimensions and file sizes before committing.

## Rationale

This is a Jekyll-based GitHub Pages site with a max content width of **900px**
(defined by `.inner { max-width: 900px }` in `assets/css/style.scss`). Full-
resolution camera photos (e.g. 4080×3072 at ~1.8 MB each) are dramatically
oversized for web display at this width.

## Target Dimensions

- Resize images to **1200px wide** (preserving aspect ratio). This provides
  sharp rendering on retina/HiDPI displays (2× the ~600px rendered width) while
  keeping file sizes reasonable.
- Use `sips --resampleWidth 1200 <file>` on macOS to resize in-place.
- For batch resizing: `sips --resampleWidth 1200 assets/img/<subdir>/*.jpg`

## Suggested Workflow

1. Copy source images into the appropriate `assets/img/<subdir>/`.
2. Run `sips -g pixelWidth -g pixelHeight assets/img/<subdir>/*` to check
   dimensions.
3. If any image exceeds 1200px wide, suggest resizing and explain the rationale
   (bandwidth savings, GitHub Pages performance, no visual quality loss at the
   site's max content width).
4. After resizing, verify with `du -sh assets/img/<subdir>/` to confirm the
   total size is reasonable.
