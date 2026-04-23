# MCP (Model Context Protocol)

MCP lets Claude Code talk to external servers — editors, databases, APIs. **This project does not need MCP for its core loop** (the game is offline, no backend, no external services). Still, a few servers can be useful if you want them.

---

## When MCP helps here

- **GitHub MCP** — lets Claude Code open issues, manage releases, browse past PRs without leaving the session. Handy if you're working alone and using Issues as a task tracker.
- **Filesystem MCP** (sandboxed directory access outside the repo) — almost never needed; your repo access is already what Claude Code has.
- **Phaser Editor MCP Server** (`phaserjs/editor-mcp-server`) — only relevant if you adopt Phaser Editor 5 to author scenes graphically. For this project we're writing scenes in TypeScript, so skip it.

## When MCP doesn't help here

- No remote database → skip DB MCPs.
- No cloud deploy pipeline → skip AWS/Vercel/Netlify MCPs.
- No chat ops → skip Slack/Linear MCPs.

## Configuring an MCP server (if you decide to add one)

Claude Code reads MCP config from its settings. Example snippet for GitHub MCP:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "<your-PAT-with-repo-scope>" }
    }
  }
}
```

Restart Claude Code after editing.

## Keeping the surface small

Each MCP server adds tools to Claude Code's context. The more you enable, the more tool-routing noise there is — which, ironically, makes the agent slower to pick the right action. Start with zero MCPs, add one if a concrete workflow demands it.

## Not the same as a plugin

- **Plugin** = Claude-Code-specific bundle (agents + skills + commands + hooks), read from local disk.
- **MCP** = open protocol, server runs as its own process, callable from any MCP-aware client.

Skills and agents in this repo are plugin-style. Nothing is exposed over MCP.
