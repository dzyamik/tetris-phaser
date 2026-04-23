# DEPLOY — manual GitHub Pages from `docs/`

**No CI/CD by design.** Deploys are intentional, manual, auditable.

---

## One-time setup (once per repo)

1. Create the GitHub repo, push your `main` branch.
2. In the repo on GitHub: **Settings → Pages**.
3. Source: **Deploy from a branch**.
4. Branch: `main`, folder: `/docs`. Save.
5. Confirm the repo slug and set it in `vite.config.ts`:

   ```ts
   // vite.config.ts
   export default defineConfig({
     base: '/<your-repo-name>/',   // e.g. '/tetris-phaser/'
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

- [ ] `docs/index.html` exists and references hashed assets under `docs/assets/`.
- [ ] `docs/.nojekyll` is present (Vite copies it from `public/`).
- [ ] `docs/manifest.webmanifest` is present.
- [ ] `docs/sw.js` or similar (service worker from `vite-plugin-pwa`) is present.
- [ ] Hit the production URL in an incognito window and verify it loads — caching has burned many hours.

## PWA caveats on GitHub Pages

- The service-worker scope is `/<repo-name>/` by default on project Pages. Make sure `vite-plugin-pwa`'s `scope` and `base` match. If icons 404 on install, 99% it's a base-path mismatch.
- GitHub Pages serves over HTTPS — good, PWAs need that.
- Custom domain? Point the domain at Pages, set `base: '/'` in Vite, and delete the repo-slug prefix. Don't forget to bump the service-worker version so clients swap.

## Rollback

Since `docs/` is tracked in Git, `git revert <bad-commit>` and push. The next build is literally the previous build.

## What to do when Pages shows a stale version

1. Hard reload (⌘⇧R / Ctrl-F5). Service workers cache aggressively.
2. DevTools → Application → Service Workers → **Unregister** → reload.
3. DevTools → Application → Storage → **Clear site data** → reload.
4. If still stale after 5 minutes, GitHub Pages build may be queued. Check **Actions** tab on GitHub (even without CI, Pages reports its build status there).
