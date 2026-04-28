# DEPLOY — manual GitHub Pages from `docs/`

**No CI/CD by design.** Deploys are intentional, manual, auditable.

---

## One-time setup (once per repo)

1. Create the GitHub repo, push your `main` branch.
2. In the repo on GitHub: **Settings → Pages**.
3. Source: **Deploy from a branch**.
4. Branch: `main`, folder: `/docs`. Save.
5. The Vite base is **relative** (`base: './'`), so the built `docs/` works at any URL — project Pages subpath, custom domain at root, or even `file://`. No repo-slug config needed:

   ```ts
   // vite.config.ts
   export default defineConfig({
     base: './',                    // relative — portable across deploy targets
     build: { outDir: 'docs', emptyOutDir: true },
     // ...
   });
   ```

6. Add `public/.nojekyll` (empty file). This stops GitHub Pages from running Jekyll, which eats files starting with `_` (Vite builds some).

## Every deploy

```bash
npm run verify      # typecheck + lint + test + build
git add docs/
git commit -m "build: refresh docs/ for <short description>"
git push origin main
```

GitHub Pages will pick up the new `docs/` within a minute or two. The URL is:
`https://<your-github-username>.github.io/<your-repo-name>/`

Or use the slash command (see `.claude/commands/deploy.md`):

```
/deploy
```

## Sanity checks before pushing

- [ ] `docs/index.html` exists and references hashed assets under `./assets/` (relative).
- [ ] `docs/.nojekyll` is present (Vite copies it from `public/`).
- [ ] `docs/manifest.webmanifest` is present.
- [ ] `docs/sw.js` or similar (service worker from `vite-plugin-pwa`) is present.
- [ ] Hit the production URL in an incognito window and verify it loads — caching has burned many hours.

## PWA caveats on GitHub Pages

- With `base: './'` the service-worker scope is `./` (relative to `registerSW.js`), so it resolves to whatever URL the page is served from. This works for both project Pages (`/<repo>/`) and custom domains at root with no config change.
- GitHub Pages serves over HTTPS — good, PWAs need that.
- Switching deploy target (subpath ↔ root ↔ different repo) requires no Vite config edit — just rebuild and push.

## Rollback

Since `docs/` is tracked in Git, `git revert <bad-commit>` and push. The next build is literally the previous build.

## What to do when Pages shows a stale version

1. Hard reload (⌘⇧R / Ctrl-F5). Service workers cache aggressively.
2. DevTools → Application → Service Workers → **Unregister** → reload.
3. DevTools → Application → Storage → **Clear site data** → reload.
4. If still stale after 5 minutes, GitHub Pages build may be queued. Check **Actions** tab on GitHub (even without CI, Pages reports its build status there).
