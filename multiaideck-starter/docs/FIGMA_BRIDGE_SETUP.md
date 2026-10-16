# Connect Claude Code to Figma (Figma Desktop Bridge)

Claude Code reads the **Design Platform** file through the `figma-console` MCP server and the Figma Desktop Bridge plugin. This works on any Figma seat, including View.

- File: https://www.figma.com/design/fCrR78u1aj0DQjzpaEhrIY/Design-Platform
- File key: `fCrR78u1aj0DQjzpaEhrIY`

## One-time setup

1. **Install Figma desktop** (the bridge does not work in the browser).
2. **Create a personal access token.** Figma → Settings → Security → Personal access tokens → Generate. Give it read access to file content and variables. It starts with `figd_`.
3. **Put the token in your environment, never in the repo.**
   - macOS / Linux: add `export FIGMA_ACCESS_TOKEN="figd_..."` to `~/.zshrc` (or `~/.bashrc`), then open a new terminal.
   - Windows: `setx FIGMA_ACCESS_TOKEN "figd_..."`, then open a new terminal.
4. **Connect Claude Code.** Choose one:
   - **Project (recommended):** keep `.mcp.json` at the repo root (already in this kit). Start `claude` in the repo and approve the `figma-console` server when asked.
   - **All projects:**
     ```bash
     claude mcp add figma-console -s user \
       -e FIGMA_ACCESS_TOKEN=figd_... -e ENABLE_MCP_APPS=true \
       -- npx -y figma-console-mcp@latest
     ```
5. **Import the bridge plugin into Figma desktop** (once). Plugins → Development → Import plugin from manifest → choose `~/.figma-console-mcp/plugin/manifest.json`. If that file doesn't exist yet, start `claude` once so the server runs and creates it, or print the path with `npx figma-console-mcp@latest --print-path`.

Requires Node.js 18 or newer (for `npx`).

## Every session

1. Open the Design Platform link in Figma desktop.
2. Run Plugins → Development → **Figma Desktop Bridge** and leave the plugin window open.
3. In the repo, start `claude`.
4. Ask: **"Check the Figma connection status."** You should see the Design Platform file connected.
5. If other Figma files are open, tell Claude to use file key `fCrR78u1aj0DQjzpaEhrIY`.

Good first prompt:

> Read the Figma variables for the Tokens page (28:7489) and generate `src/styles/tokens.css` as described in AGENTS.md. Read only; don't change Figma.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| "Cannot connect" / not connected | The bridge plugin isn't running. Run it in the Design Platform file. |
| Plugin shows "MCP scanning" or "Retry" | Claude Code isn't running yet. Start `claude`, then press Retry. |
| Claude reads the wrong file | Close the bridge in other files or switch to Design Platform; pass the file key. |
| `/mcp` shows figma-console failed | Restart `claude`; check `echo $FIGMA_ACCESS_TOKEN` prints your token; check Node is installed. |
| Port 9223 in use | Another Claude session holds the bridge. Close it, or restart the plugin. |

## Rule: read-only

During development Claude Code only **reads** from Figma (components, variables, styles, screenshots). It never edits the file. Design changes are made by the designer in Figma, then re-read.

## Optional: official Figma MCP

If you have a Dev or Full seat, you can add the official server too (better code hints, Code Connect):

```bash
claude plugin install figma@claude-plugins-official
# or
claude mcp add --transport http figma https://mcp.figma.com/mcp
```

On a View seat it is heavily rate-limited, so the bridge stays the main connection.
