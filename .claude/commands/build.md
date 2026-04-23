---
description: Build the production bundle into docs/ (Vite → GitHub Pages target).
---

Run `npm run build` and report the result.

Afterwards verify that `docs/` contains at minimum:

- `docs/index.html`
- `docs/assets/` with hashed JS/CSS
- `docs/.nojekyll`
- `docs/manifest.webmanifest`
- The service-worker file emitted by `vite-plugin-pwa` (typically `docs/sw.js` or `docs/registerSW.js`)

If any are missing, show what is missing and stop. Do **not** commit `docs/` — leave that to the user or to `/deploy`.
