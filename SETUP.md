# SETUP — establishing the repo and environment

One-time steps. After this, daily work is just `npm run dev`.

---

## 0. Prerequisites

- **Node.js 20+** (check with `node -v`; use [nvm](https://github.com/nvm-sh/nvm) if you need to switch versions).
- **Git** and a GitHub account.
- **Claude Code** installed and signed in.

## 1. Create the GitHub repo

1. On GitHub, create a new **public** repo. Any name works; it'll appear in your Pages URL as `https://<user>.github.io/<repo-name>/`. Example: `tetris-phaser`.
2. Do **not** initialize with a README/gitignore/license — we're going to push our own.
3. Clone it locally:
   ```bash
   git clone git@github.com:<user>/<repo-name>.git
   cd <repo-name>
   ```

## 2. Drop in this bundle

Unzip the documentation bundle into the repo root so your tree looks like:

```
<repo-name>/
├── .claude/
├── docs-dev/
├── public/
├── CLAUDE.md
├── README.md
├── SETUP.md
├── LICENSE
├── INIT-PROMPT.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── eslint.config.js
├── .prettierrc
├── .gitignore
└── index.html
```

Nothing else yet — `src/`, `tests/`, `docs/` will be created by Claude Code during bootstrap.

## 3. Personalize before installing

Open these three files and replace the placeholder:

1. **`vite.config.ts`** — set `base: '/<repo-name>/'` (must match your GitHub repo slug, with a trailing slash).
2. **`package.json`** — set `"name"` to your repo slug, and update `"homepage"` to `"https://<user>.github.io/<repo-name>/"`.
3. **`README.md`** — replace the `<your-github-username>/<your-repo-name>` placeholder in the "Play it" link.

If you forget step 1, the built app will 404 its own assets on GitHub Pages. It's the single most common deploy-day mistake.

## 4. Install dependencies

```bash
npm install
```

This pulls Phaser 4, Vite, TypeScript, Vitest, ESLint, Prettier, and `vite-plugin-pwa`. Once installed, **confirm the Phaser skills are on disk**:

```bash
ls node_modules/phaser/skills/
```

You should see 28 skill folders (game-setup-and-config, scenes, loading-assets, filters-and-postfx, v3-to-v4-migration, etc.). Claude Code will consult these during development.

## 5. Initial commit

```bash
git add .
git commit -m "chore: scaffold project docs and Claude Code config"
git push -u origin main
```

## 6. Configure GitHub Pages

On GitHub:
- **Settings → Pages**
- Source: **Deploy from a branch**
- Branch: **`main`**, folder: **`/docs`**
- Save

The URL will be ready in a minute. It'll 404 until your first real build+commit of `docs/` — that's expected.

## 7. (Optional but recommended) Install the Phaser 4 Claude Code plugin

See [`docs-dev/PLUGINS.md`](./docs-dev/PLUGINS.md). TL;DR add this to your Claude Code settings and restart:

```json
{
  "extraKnownMarketplaces": {
    "phaser4-gamedev": {
      "source": { "source": "github", "repo": "Yakoub-ai/phaser4-gamedev" }
    }
  },
  "enabledPlugins": {
    "phaser4-gamedev@phaser4-gamedev": true
  }
}
```

It adds four Phaser-specialist subagents and a hook that warns on Phaser 3 API leaks.

## 8. Open Claude Code in the repo

```bash
cd <repo-name>
claude
```

Claude Code reads `CLAUDE.md` on open. Verify it sees the project-local config:
- `/agents` → should list `tetris-tuner`, `core-purity-auditor`.
- `/plugins` (if you did step 7) → should show `phaser4-gamedev` enabled.

## 9. Kick off Milestone 0

Paste the contents of [`INIT-PROMPT.md`](./INIT-PROMPT.md) into Claude Code. That prompt tells Claude Code to bootstrap the `src/` tree, wire up Vite/TS/Vitest/PWA, and produce a working empty scene — i.e., finish Milestone 0.

After it's done:

```bash
npm run dev       # play the (empty) game locally
npm run build     # produce docs/
git add docs/ && git commit -m "build: initial docs/" && git push
```

Visit your Pages URL. You should see Phaser's canvas with the placeholder background color. Congratulations — M0 complete.

## 10. Daily workflow

- Start Claude Code, say "work on milestone N" (or use `/milestone N` to pull up the DoD first).
- When you're done or at a good checkpoint, use `/verify` to run the full chain.
- To ship: `/deploy` (builds + stages + commits `docs/`, leaves pushing to you).

## Troubleshooting

- **`npm install` complains about peer deps.** Phaser 4 is on npm as `phaser@^4`. If you get old v3 pulled in, explicitly `npm i phaser@latest`.
- **GitHub Pages shows 404 after push.** Wait 1–2 minutes. Then check **Actions** on GitHub (Pages reports its build even without CI). Hard-reload in incognito.
- **Assets 404 on the live site.** Your `vite.config.ts` `base` doesn't match your repo name. Fix and rebuild.
- **PWA won't install.** Open DevTools → Application → Manifest. Make sure icons resolve (again, usually a base-path issue), the site is served over HTTPS (GitHub Pages always is), and there's a registered service worker.
- **Claude Code ignores my slash commands.** Confirm files exist under `.claude/commands/`. Restart Claude Code if you just added them.
