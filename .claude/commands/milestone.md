---
description: Print the Definition of Done for milestone N from docs-dev/ROADMAP.md (usage - /milestone N).
argument-hint: <milestone-number>
---

Read `docs-dev/ROADMAP.md` and print the **Goal, Deliverables, and DoD** section for milestone `$ARGUMENTS`.

Do not summarize, do not add commentary — just extract the milestone block verbatim so the user has it in context before starting work.

If `$ARGUMENTS` is missing or invalid, list all milestone numbers and their ☐/⧗/☑ status from the roadmap instead.
