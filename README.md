# MultiAIDeck · Claude Code starter kit

Copy everything in this folder (including the hidden `.mcp.json`, `.agent/` and `.gitignore`) into the root of your empty project repo.

| File | What it does |
| --- | --- |
| `CLAUDE.md` | Claude Code reads it on start: Figma link, file key, node IDs, read-only rule, imports `AGENTS.md` |
| `AGENTS.md` | Shared rules for Claude Code and Antigravity (stack, folders, pixel-perfect rules) |
| `.mcp.json` | Connects Claude Code to Figma via the Figma Desktop Bridge (`figma-console-mcp`) |
| `.agent/rules/project.md` | Points Antigravity at `AGENTS.md` |
| `docs/BUILD_GUIDE.md` | The full step-by-step build guide |
| `docs/FIGMA_BRIDGE_SETUP.md` | How to connect the bridge, every-session checklist, troubleshooting |

Start here: `docs/FIGMA_BRIDGE_SETUP.md`, then Phase 2 of `docs/BUILD_GUIDE.md`.
