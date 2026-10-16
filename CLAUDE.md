@AGENTS.md

# Claude Code notes for MultiAIDeck

## Design source (Figma, via Figma Desktop Bridge)

- File: **Design Platform** — https://www.figma.com/design/fCrR78u1aj0DQjzpaEhrIY/Design-Platform
- File key: `fCrR78u1aj0DQjzpaEhrIY` (pass it as `fileKey` on every Figma call if other files are open)
- Connection: the `figma-console` MCP server in `.mcp.json` (Figma Desktop Bridge plugin, port 9223). Setup: `docs/FIGMA_BRIDGE_SETUP.md`.
- At the start of a session, call `figma_get_status`. If it is not connected, ask the user to open the file in Figma desktop and run Plugins → Development → Figma Desktop Bridge. Do not guess designs without a working connection.

### Figma is READ-ONLY during development

Never create, rename, move, edit or delete anything in Figma. Do not use `figma_execute` for writes, `figma_set_*`, `figma_create_*`, `figma_delete_*`, `figma_update_*` or `figma_post_comment`. Read with tools such as `figma_get_component_for_development`, `figma_get_variables`, `figma_get_styles`, `figma_get_text_styles`, `figma_capture_screenshot`, `figma_get_file_data`. If the design looks wrong or a state is missing, stop and tell the user. Don't fix it in Figma.

### Main pages

| Page | Node ID |
| --- | --- |
| Tokens (Luminous variables, text styles) | `28:7489` |
| Design system (atoms → templates) | `28:7490` |
| Prototype (desktop + mobile screens, flows) | `28:7492` |

### Key nodes

| What | Node ID |
| --- | --- |
| Composer set (Default `28:8564`, Voice listening `147:38927`, Attachment `147:39000`) | `147:39061` |
| Composer "+" menu (Add photos & files) | `147:38907` |
| Patterns section (mobile & chat components taken from the screens; code-only effects note) | `288:45232` |
| Brand logos section (AI + payments) | `268:41859` |
| AI logo set: 23 brands × Style (Color, App icon, Black, White) → `AiLogo`, `npm run ai-logos` | `268:41860` |
| AI wordmark (21 products) · Company logo (11 companies) | `268:41861` · `268:41862` |
| Payment logo (bKash, Nagad) → `public/logos/payment` · Payment logo slot (white tile, used by Wallet, Checkout dialog, M11, M34) | `276:52024` · `103:20611` |
| Model orb (the model's App icon in a circle; 9 models × lg/md/sm) · Model logo (Brand/Mono) | `28:8269` · `255:40944` |
| Answer card: Suggested / Default / Failed | `28:8619` / `103:25245` / `158:17872` |
| Usage card · Activity table · Settings nav | `103:20960` · `103:21035` · `28:8735` |
| Sidebar set (Expanded `28:8525`, Collapsed rail `227:32794`) — option A (R17) | `227:32985` |
| Sidebar section header · Project row · Chat row | `245:28609` · `245:28699` · `245:28743` |
| Credits (collapsible: Collapsed `245:28779` / Expanded `245:28789`) | `245:28812` |
| Menu item · Account menu (Settings lives here now) | `245:28774` · `245:28819` |
| Overlay · Account menu (light / dark) | `245:36075` / `245:36836` |
| Project pages light: MultiAI launch · Coffee brand · Thesis research | `245:36126` · `245:38074` · `245:38534` |
| Project pages dark | `245:36659` · `245:38304` · `245:38764` |
| Overlay · New project (light / dark) | `245:36384` / `245:36921` |
| Desktop journey start (Sign in): light / dark | `166:26700` / `245:36739` |
| Mobile screens M1–M43 (start) | `166:21095` |
| Compare boards R12 · R13 · R14 (6 models) · R15 (failed follow-up) | `119:33304` · `147:39063` · `158:16110` · `158:21664` |

Prototype flows: "0 · Desktop · Full journey (start here)", "8 · Dark · Full journey (start here)", "9 · Projects & account menu" and "7 Mobile (Android)" cover every screen with no dead ends. Use them as the source for routes and e2e tests.

Sidebar behaviour (R17/R18): Settings is no longer reached from the account row directly — ⋯ or the account row opens the Account menu (Settings → Settings · Profile, Usage & billing → Settings · Usage, Language → Settings · Profile, Help & support, Sign out → sign-out dialog). Credits fold/unfold with the chevron; "Top up" goes to Wallet, "Go Pro" opens the Go Pro dialog. "＋" next to Projects opens New project; Create project goes to the project page.

### Tokens

Variable collections: `Primitives`, `Luminous` (modes Light / Dark), `Luminous · Dimension`, `Luminous · Motion`. Text styles live under `Luminous/*` (Geist). Generate `src/styles/tokens.css` from these; never type values by hand.

## Build guide

The full step-by-step plan is in `docs/BUILD_GUIDE.md`. Where it says "Figma MCP", use the `figma-console` bridge above. The official Figma MCP is optional and needs a Dev or Full seat.
