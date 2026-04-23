# PLUGINS

Claude Code plugins bundle agents + skills + commands + hooks into an installable unit. This project is designed to work **without any plugins**, but two are recommended.

---

## Recommended: `phaser4-gamedev` (community)

- **Repo:** `Yakoub-ai/phaser4-gamedev` on GitHub.
- **What it ships:** 4 subagents (architect, coder, debugger, asset-advisor), 10+ skills covering Phaser subsystems, slash commands (`/phaser-new`, `/phaser-validate`, `/phaser-build`), and hooks (including one that flags Phaser-3-era API usage).
- **Why use it:** the hooks catch v3 API leaks before they're merged — worth the install on its own.

### Install

In Claude Code, add the marketplace and enable the plugin. The typical pattern (check the plugin README for current syntax):

```json
// ~/.config/claude-code/settings.json (or the project equivalent)
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

Then restart Claude Code. Verify with `/plugins` (or your CLI's equivalent listing command). You should see `phaser4-gamedev` enabled.

### What changes in your workflow

- Asking about scene architecture tends to route to `phaser-architect`.
- Bug reports like "my sprite disappears after rotate" route to `phaser-debugger`.
- A pre-commit-style hook will warn if Phaser-3 APIs show up in a diff.

### Can be removed safely

The skills and agents in this repo (`CLAUDE.md`, `.claude/skills/`, `.claude/agents/`, `docs-dev/*`) are the primary contract. The plugin is *accelerant*, not dependency. Remove it any time.

---

## Optional: MCP-backed skill discovery

If you have multiple Claude-compatible tools (Cursor, Codex CLI, etc.) sharing skills across them, consider the Claude Skills MCP server (`K-Dense-AI/claude-skills-mcp` or similar). It surfaces skills via MCP tools so non-Claude-Code agents can consume them too. **Not needed for this project**, since Claude Code reads the `.claude/skills/` folder natively.

---

## Not recommended for this project

- **Phaser Editor MCP Server** (`phaserjs/editor-mcp-server`). It's great, but requires running Phaser Editor 5 alongside your IDE and leans on its scene-generator workflow. Overkill for a NES-style Tetris.
- **Large agent aggregators** (e.g., 150+ skill meta-plugins). They bloat context and slow routing. Prefer the focused `phaser4-gamedev` + this repo's local skills.

---

## If you write your own plugin

Keep it repo-shaped:

```
my-plugin/
├── .claude-plugin/
│   ├── plugin.json
│   └── marketplace.json
├── agents/
├── commands/
├── hooks/
├── skills/
└── README.md
```

Publish on GitHub; users enable it via `extraKnownMarketplaces` + `enabledPlugins`.
