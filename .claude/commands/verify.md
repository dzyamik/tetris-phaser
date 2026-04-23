---
description: Run the full verification chain — typecheck + lint + test + build.
---

Run `npm run verify` and report the result.

If any step fails, stop at the failing step and show the error output. Do **not** silently paper over failures (e.g., by adding `// eslint-disable`, `// @ts-ignore`, or skipping tests). Fix the root cause.

If everything passes, respond with a one-line green confirmation.
