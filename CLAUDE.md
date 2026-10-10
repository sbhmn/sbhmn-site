# sbhmn.com

Static site, no build step: GitHub Pages serves `main` as is (CNAME `sbhmn.com`), behind Cloudflare.

- **After changing anything under `assets/`, run `node dev/stamp.mjs` before committing.** It stamps every asset URL
  with a fingerprint of its content (`?v=<hash>` on the pages' links, the import map in `index.html`, the fonts in
  `site.css`), so visitors get the new files at once instead of Cloudflare's hours-old cached copies.
  `node dev/stamp.mjs --check` exits 1 if a stamp is stale.
- A script that fetches a file itself (a model, a texture, a sound, JSON) wraps the URL in `v()` from `assets/v.js`;
  imports need nothing (they go through the import map).
- The intro's paper is a print of the live home page: after a visible change to the top of the home page, re-render
  the prints with `node dev/paper-shots.cjs` (local server on port 8787), then stamp.
