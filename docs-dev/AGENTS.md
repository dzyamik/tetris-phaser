# AGENTS

Claude Code can launch **subagents** (background contexts with their own tools and prompts) to focus on specific tasks. This repo relies on three tiers of agents.

---

## Tier 1 — Claude Code's built-in general agent

This is what you get by default. It reads `CLAUDE.md`, uses file tools and bash, and does most of the work. Use it unless you explicitly want one of the specialists below.

## Tier 2 — from the `phaser4-gamedev` plugin (recommended, optional)

Install the community plugin (`Yakoub-ai/phaser4-gamedev`) — see `PLUGINS.md`. It ships four Phaser-aware subagents that auto-trigger on intent:

| Agent                    | Model  | Triggers                                                 |
|--------------------------|--------|----------------------------------------------------------|
| `phaser-architect`       | Opus   | "design a game", "plan scene flow", "what scenes do I need?" |
| `phaser-coder`           | Sonnet | Routine implementation asks about Phaser objects, physics, scenes |
| `phaser-debugger`        | Opus   | "why doesn't X render", "piece disappears", "frame drops" |
| `phaser-asset-advisor`   | Sonnet | "where do I find assets", "what format for audio"        |

You do not invoke these by name. Claude Code routes to them automatically when your request pattern-matches their triggers.

## Tier 3 — project-local agents (in `.claude/agents/`)

Defined in this repo. Narrow, task-specific. Edit freely.

### `tetris-tuner` (in `.claude/agents/tetris-tuner.md`)

**Purpose:** Iterate on game-feel numbers (DAS initial, ARR, gravity, soft-drop behavior, line-clear animation frames) without touching architecture.

**When to invoke:** when you want someone to propose values, justify them against the NES spec, and leave the rest of the code alone.

Example: *"The game feels sluggish on mobile. Use the tetris-tuner agent to propose alternate DAS values and defend them."*

### `core-purity-auditor` (in `.claude/agents/core-purity-auditor.md`)

**Purpose:** Audit the codebase for violations of the "no Phaser in `src/core/**`" rule and report offenders.

**When to invoke:** before major merges, or when you suspect drift.

---

## Picking an agent

Default to the general-purpose agent. Reach for a specialist when:

- You're in a deep, specific domain (Phaser renderer internals → `phaser-debugger`).
- You want an isolated context that won't pollute your main thread (tuning session → `tetris-tuner`).
- You're doing a scan/audit (→ `core-purity-auditor`).

If you find yourself creating a one-off agent for every task, delete this section and stop. Agents are for recurring, distinct specializations.

## Extending this set

Add a new `.claude/agents/<name>.md` with:

```markdown
---
name: <name>
description: <when Claude Code should pick this agent>
model: sonnet | opus | haiku
tools: [read, write, bash, ...]   # optional restriction
---

<system prompt for the subagent>
```

Keep the description action-oriented. Claude Code uses it to decide when to delegate.
