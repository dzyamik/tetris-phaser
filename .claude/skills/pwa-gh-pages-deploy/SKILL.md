---
name: pwa-gh-pages-deploy
description: Manual GitHub Pages deploy from docs/, plus PWA manifest / service-worker / base-path gotchas. Load when building for production, touching vite.config.ts, the manifest, icons, or the service worker, or when debugging "assets 404 on the live site" or "PWA won't install".
---

# PWA + GitHub Pages deploy playbook

This project **has no CI/CD**. Deploys are deliberate: build locally → commit `docs/` → push. That's it.

---

## The base-path rule (relative base by default)

This project uses a **relative** Vite base so the built `docs/` is portable — it works at any URL (project Pages subpath, custom domain at root, copied into another site, or `file://`):

```ts
// vite.config.ts
export default defineConfig({
  base: './',                          // relative — no need to match the repo slug
  build: { outDir: 'docs', emptyOutDir: true },
});
```

What this gets you:
- `docs/index.html` references `./assets/...`, `./favicon.svg`, `./manifest.webmanifest`, `./registerSW.js`.
- `docs/registerSW.js` registers `./sw.js` with `scope: './'`, so the service worker scopes to whatever URL serves the page.
- Switching subpath ↔ root ↔ different repo requires **no config change** — just rebuild.

If you ever need an absolute base (e.g., the host can't serve relative URLs from `index.html`), set `base: '/<repo-name>/'` and rebuild — but the relative default is preferred.

Symptoms that you regressed the base config:
- White screen on the live site, 404s for `/assets/index-abc123.js` in DevTools Network.
- PWA icons 404 during install.
- Service worker registers against the wrong scope; offline doesn't work after install.

## Required static files (live in `public/`, copied to `docs/`)

| File                          | Why                                                          |
|-------------------------------|--------------------------------------------------------------|
| `public/.nojekyll`            | Empty. Stops GitHub Pages from running Jekyll, which eats `_*` files that Vite emits. Non-negotiable. |
| `public/manifest.webmanifest` | PWA manifest — name, icons, theme colors, `display: standalone`, `orientation: portrait`. |
| `public/icons/icon-192.png`   | Required by manifest. |
| `public/icons/icon-512.png`   | Required by manifest. |
| `public/icons/icon-maskable-512.png` | `purpose: maskable` — required for adaptive icons on Android. |
| `public/favicon.svg`          | Browser tab icon. |

## `vite-plugin-pwa` configuration

Use `registerType: 'autoUpdate'`. Include assets explicitly so the Workbox precache covers them:

```ts
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['icons/*', 'favicon.svg', '.nojekyll'],
  manifest: { /* ... */ },
  workbox: {
    globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,woff2,ico}'],
    navigateFallback: 'index.html',
    cleanupOutdatedCaches: true,
  },
  devOptions: { enabled: false },
});
```

`navigateFallback: 'index.html'` makes SPA-style navigation work offline. `cleanupOutdatedCaches: true` prevents old SW caches from stacking up across deploys.

## The manual deploy sequence

```bash
npm run verify              # typecheck + lint + test + build (one command does it all)
git add docs/
git commit -m "build: refresh docs/ for <short description>"
git push origin main
```

GitHub Pages usually serves the new build within 1–2 minutes.

Or use `/deploy` which scripts steps 1–3 and leaves the push to the user.

## Sanity checks before pushing

- [ ] `docs/index.html` exists and its `<script>` / `<link>` tags reference hashed assets under `./assets/...` (relative).
- [ ] `docs/.nojekyll` exists.
- [ ] `docs/manifest.webmanifest` exists.
- [ ] Service-worker file exists (`docs/sw.js` or `docs/registerSW.js` — the plugin emits at least one).
- [ ] Icons exist under `docs/icons/`.
- [ ] Open the preview: `npm run preview` and verify the app loads at the preview URL.

## Rollback

`docs/` is tracked in Git. If the deploy breaks:

```bash
git revert <bad-commit>
git push origin main
```

The next built version is literally the previous build.

## "Stale version on live site" checklist

1. Hard reload in incognito (⌘⇧R / Ctrl-F5). Service workers cache hard.
2. DevTools → Application → Service Workers → **Unregister** → reload.
3. DevTools → Application → Storage → **Clear site data** → reload.
4. If still stale after ~5 minutes, check the repo's **Actions** tab on GitHub — Pages reports its build status there even without user-defined CI.
5. Ensure `cleanupOutdatedCaches: true` is set on the Workbox config, and that the SW version actually bumped on your last build (Vite changes the hash; the plugin bumps the SW).

## PWA install caveats

- **iOS Safari** requires a user-driven `add to home screen`. No programmatic install. Test by using Safari's Share sheet.
- **Android Chrome** shows `beforeinstallprompt`. Capture the event in `PWAService` and surface a CTA only after the user interacts — browsers now silently drop the event if you call `prompt()` without a user gesture.
- **iOS Safari splash screens** require separate `apple-touch-startup-image` link tags per device size. Optional, not required for v1.
- The HTTPS requirement is satisfied automatically — GitHub Pages is HTTPS by default.

## When touching a live deploy

If you change `base` (e.g., swapped to a custom domain), you **must** bump something in the SW precache manifest so existing clients invalidate. The `autoUpdate` strategy does this for you as long as the built JS hashes change. If they don't, touch a file that gets bundled.
