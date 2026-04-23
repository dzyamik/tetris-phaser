---
description: Build and stage a docs/ refresh commit. Leaves pushing to the user.
---

1. Run `npm run verify`. If it fails, stop — do not build a broken bundle.
2. Run `npm run build`.
3. `git add docs/`.
4. If there are no staged changes under `docs/`, report "no changes to deploy" and stop.
5. Show `git diff --cached --stat docs/` so the user sees what's about to be committed.
6. **Ask the user for a short description** of what changed (e.g., "M2 keyboard input", "fix gravity off-by-one"), then create the commit:
   ```
   build: refresh docs/ for <description>
   ```
7. Show `git log -1 --oneline` for confirmation.

Do **not** push automatically. The user pushes when ready (`git push origin main`).
