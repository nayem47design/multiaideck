# MultiAIDeck · Build guide (Claude Code + Antigravity)

Oct 15, 2026 · @Musemind BA

## Summary

Pixel-perfect comes from three habits, not from the AI: a clean Figma file, tokens and components built bottom-up before any screen, and an automatic screenshot comparison against Figma on every change. Claude Code is the main builder because it connects to Figma's official MCP server. Antigravity is the second agent, used for checking screens in its browser and for backend work running in parallel.

| Job | Claude Code | Antigravity |
| --- | --- | --- |
| Read the Figma file (tokens, frames, components) | Yes, official remote Figma MCP | Only through Figma's desktop MCP server, unofficial |
| Build tokens and UI components | Primary | Review only |
| Build screens and flows | Primary | Second opinion on hard screens |
| Backend, APIs, payments, database | Shared | Good fit, run in parallel on its own branch |
| Look at the running app in a browser | Through a Playwright MCP | Built in: browser agent opens localhost and screenshots |
| Visual and flow QA | Writes the Playwright tests | Clicks through the prototype flows and reports |

Rule that prevents most chaos: the two tools never edit the same branch at the same time. Each works on its own git branch (or worktree), and changes come back through pull requests.

The phases, in order:

1. Phase 0: get the Figma file and decisions ready.
2. Phase 1: set up the tools and shared rules.
3. Phase 2: create the project skeleton.
4. Phase 3: turn Figma tokens, fonts and type into code.
5. Phase 4: build components from atoms to organisms.
6. Phase 5: build screens, routes and flows.
7. Phase 6: build the backend and integrations.
8. Phase 7: pixel-perfect QA.
9. Phase 8: launch.

## Phase 0 · Before writing any code

The AI copies what it reads from Figma, so every inconsistency in the file becomes an inconsistency in code. Fix the file first; every hour here saves rework in code.

**Figma seat.** Give the developer a Dev or Full seat. On a View seat Figma's MCP server is heavily rate-limited, which is exactly what stopped the analysis earlier.

**Figma file cleanup** (from the analysis doc):

- [ ] Rename "MultiAI" and "Atlas" to the final product name everywhere.
- [ ] Apply the Luminous text styles to every text layer; add styles for the off-scale sizes or snap them to the scale.
- [ ] Bind every remaining raw colour (mostly white) to a token, so Dark mode works.
- [ ] Darken `lum/ink-3` in Light mode for 4.5:1 contrast.
- [ ] Delete the legacy `Color` and `Spacing & Radius` collections and the old text styles.
- [ ] Add a Bangla text style set using Noto Sans Bengali.
- [ ] Name every layer that matters (no "Frame 412"); the names become component and prop names.
- [ ] Add hover, focus, pressed, disabled and loading states to buttons, inputs, nav items and rows.
- [ ] Write a description on each component: what it is, when to use it.
- [ ] Put final screens in clearly named sections; mark old explorations as "Archive".
- [ ] Replace placeholder costs and payment logos with real ones.

**Decisions to write down before Phase 1:**

| Decision | Recommended answer | Why |
| --- | --- | --- |
| Platforms | One responsive web app (desktop + mobile web), installable as a PWA | The 360 px mobile designs work as a web app; a native app can follow later |
| Breakpoints | 360, 412, 768, 1024, 1440 | Matches the Figma frames plus common Android and tablet widths |
| Languages | English and Bangla from day one | Retrofitting translation later touches every screen |
| Themes | Light and Dark, from tokens | Already modelled as Figma variable modes |
| AI providers | OpenAI, Anthropic, Google, DeepSeek, xAI, called from your server | Keys stay on the server; you control timeouts and refunds |
| Payments | PayStation for bKash, Nagad and card | Already in the designs |
| Sign-in | Phone number + SMS code, Google as an option | Matches the mobile and desktop sign-in screens |

**Accounts to open:** GitHub (repo), a hosting platform, a Postgres database, an SMS gateway in Bangladesh, PayStation merchant account (sandbox first), and API keys for each AI provider.

## Phase 1 · Set up the tools

Both agents read the same rules file and the same Figma file, but only Claude Code talks to Figma directly. Do these steps once, in order.

1. **Install the basics:** Git, Node.js (current LTS), pnpm, and the Figma desktop app.
2. **Install Claude Code.** macOS, Linux or WSL: `curl -fsSL https://claude.ai/install.sh | bash`. Windows PowerShell: `irm https://claude.ai/install.ps1 | iex`. Then run `claude --version` and `claude` to log in.
3. **Connect Claude Code to Figma.** Run `claude plugin install figma@claude-plugins-official`, restart Claude Code, open `/plugin`, select figma and sign in. The plugin adds the MCP server plus Figma's own skills. Manual alternative: `claude mcp add --transport http figma https://mcp.figma.com/mcp`.
4. **Test it.** In Claude Code, paste a frame link from Design Platform and ask: "Get the design context and a screenshot of this frame." A screenshot coming back means it works.
5. **Add a browser for Claude Code.** Add the Playwright MCP server so it can open `localhost`, click through flows and take screenshots.
6. **Install Antigravity** from Google, import your VS Code settings, and open the same project folder.
7. **Antigravity and Figma (optional).** Figma does not officially support Antigravity yet; the remote server rejects it. Workaround: in Figma desktop, enable the desktop MCP server (Dev Mode, inspect panel), then in Antigravity open the agent panel's "..." menu, then MCP Store, then add "Figma Dev Mode MCP". Antigravity's config lives in `~/.gemini/antigravity/mcp_config.json`. If it fails, skip it: Antigravity does not need Figma for its jobs.
8. **Create the repo** on GitHub with branch protection on `main`: pull requests only, checks must pass.
9. **Write the shared rules once** in `AGENTS.md` at the repo root. Claude Code reads it; add one line `@AGENTS.md` in `CLAUDE.md` to be sure. For Antigravity, add `.agent/rules/project.md` that says "Follow AGENTS.md exactly."
10. **Save repeatable prompts.** Claude Code: skills in `.claude/skills/` (for example `/build-component`, `/compare-to-figma`). Antigravity: workflows in `.agent/workflows/`.

**What goes in AGENTS.md** (keep it under two pages):

- The stack and folder structure (Phase 2).
- "Never hard-code a colour, size, radius, shadow or font. Use tokens from `src/styles/tokens.css` only."
- "Before building any UI, read the Figma node with the Figma MCP (design context + screenshot + variables). Reuse existing components in `src/components` before creating new ones."
- "Every component gets a Storybook story and a visual test against its Figma screenshot. A change is not done until the visual test passes."
- "All user-facing text goes through the translation files (English and Bangla). No text in components."
- "Each answer is independent: never send one AI model's answer to another model."
- "Work only on your own branch. Never push to main."
- The Figma file link and the node IDs of the main pages (Tokens, Design system, Prototype, Mobile).

## Phase 2 · Project skeleton

One Next.js app serves desktop and mobile web, with tokens as CSS variables so Light, Dark and every component come from the same source. Ask Claude Code to scaffold this in one session, then review it before any UI work.

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js (App Router) + TypeScript, strict mode | Server routes for AI calls and payment webhooks |
| Styling | Tailwind CSS with a theme built on CSS variables | Tokens live in one CSS file, never in components |
| Primitives | Radix UI (dialog, popover, tabs, select, toggle) | Accessible behaviour; you supply all the styling |
| Motion | Motion (Framer Motion) | Durations and easing from the Motion tokens |
| Fonts | `next/font` with Geist, Geist Mono, Noto Sans Bengali | Self-hosted; no layout shift |
| Languages | next-intl, English + Bangla message files | All copy out of components |
| AI calls | Vercel AI SDK (or direct provider SDKs) | Parallel streaming to 3+ models with timeouts |
| Data | Postgres + Drizzle ORM + Zod validation | Credits ledger needs a real database |
| Component workshop | Storybook | One story per component and state |
| Tests | Vitest (logic), Playwright (flows + screenshots) | Visual comparison against Figma in Phase 7 |
| Quality gates | ESLint, Prettier, TypeScript, Husky pre-commit | CI runs them on every pull request |

Folder structure to put in AGENTS.md:

```
src/
  app/                  routes: (auth) (app) settings wallet api
  components/
    atoms/              Button, IconButton, Badge, Input, Toggle, ModelOrb...
    molecules/          SegmentedControl, ModelChip, SettingRow, ReceiptStrip...
    organisms/          Sidebar, Composer, AnswerCard, ModelPicker, Checkout...
    templates/          AppShell, SettingsShell, MobileShell
  styles/
    tokens.css          generated from Figma variables (Light + Dark)
    typography.css      text styles as classes
  lib/                  ai/, billing/, payments/, auth/, i18n/
  messages/             en.json, bn.json
tests/
  visual/               Figma reference images + comparison tests
  e2e/                  user flows from the prototype
.storybook/
AGENTS.md  CLAUDE.md  .agent/rules/  .claude/skills/
```

Scaffold steps:

1. Ask Claude Code: "Create the Next.js project exactly as described in AGENTS.md, with Tailwind, Storybook, Playwright, Vitest, ESLint, Prettier and Husky. Do not build any UI yet."
2. Run it locally, open Storybook, run the empty test suites. All green before moving on.
3. Add CI (GitHub Actions): install, type-check, lint, unit tests, build, Storybook build, visual tests.
4. Commit, open the first pull request, merge. Every later piece of work starts from a fresh branch.

## Phase 3 · Tokens, fonts and type into code

Tokens are generated from Figma, never typed by hand, so a colour changed in Figma changes everywhere in code. This phase decides most of the pixel accuracy.

1. **Export the variables.** Ask Claude Code to read the four Luminous collections with the Figma MCP (variables for the Tokens page) and write `tokens.css`: Primitives as raw values, Luminous as semantic variables under `:root` (Light) and `[data-theme="dark"]` (Dark), Dimension as spacing, radius and size variables, Motion as durations and easings. Keep the Figma names (`--lum-ink-2`, `--space-4`, `--radius-xl`).
2. **Map them into Tailwind.** Theme colours, spacing, radius, font sizes and shadows point at the CSS variables, so `bg-surface` or `rounded-xl` always resolve to tokens. Turn off Tailwind's default palette so nobody can use `bg-blue-500`.
3. **Fonts.** Load Geist, Geist Mono and Noto Sans Bengali with `next/font`. Set the font stack to Geist first and Noto Sans Bengali second, so Bangla characters fall back correctly inside English sentences.
4. **Type styles.** One class per Figma text style with exact size, line height, weight and letter spacing (for example Display 48/54 Light −1.6). Add matching Bangla variants with a taller line height.
5. **Effects.** Elevation and glass become utilities. Glass uses `backdrop-filter: blur(28px)` with a solid `lum/surface` fallback for low-end phones and when reduced transparency is on.
6. **Check it.** A Storybook "Tokens" page shows every colour, size, radius, shadow and text style in Light and Dark. Put it next to the Figma Tokens page and compare by eye before building a single component.

Two things to watch: Figma line heights are absolute pixels, so use pixel line heights, not unitless ones. Figma letter spacing in percent must be converted to `em` (−1% = −0.01em).

## Phase 4 · Components, bottom-up

Build the 188 Figma components in the same atomic order as the library, one small pull request at a time; screens come only after every part they use passes its visual test.

Build order:

1. **Atoms (19 + icons):** Button, Icon button, Badge, Input, Toggle, Checkbox, Radio, Model orb, AI orb, Avatar, Progress bar, Metric chip, Thinking dots, Skeleton, Divider, Text link. Icons: export the Hugeicons set as SVG React components once.
2. **Molecules (21):** Segmented control, Search field, Nav item, Select, Field, Setting row, Model chip, Model list row, Receipt strip, Pack row, Cost estimate, Prompt bubble, Prompt receipt, Toast, Banner, Tooltip, Empty state.
3. **Organisms (24+):** Sidebar, Composer (Default, Voice listening, Attachment), Composer menu, Answer card (Suggested, Default, Failed), Best answer card, Model picker, Checkout and payment result dialogs, Settings nav, tables, Usage card.
4. **Templates (4 + mobile):** App shell, Settings shell, Full page with checkout, Modal over app, plus the mobile shell with bottom tabs and sheets.

Rules for every component:

- Props mirror Figma variant properties exactly (`variant="primary" size="md"`, `state="failed"`).
- Every state exists in code even if Figma lacks it (hover, focus ring, pressed, disabled, loading); design the missing ones from tokens and note them for the designer.
- Light and Dark both pass before merge.
- Add Figma Code Connect for each finished component, so the Figma MCP returns your real component code instead of generic code when later screens are built.

The loop for every component:

&#91;embedded content: the pixel loop for each component\]

The comparison is automatic (Phase 7), so "matches" means the screenshot diff is within the agreed threshold, not that it looks close.

## Phase 5 · Screens, routes and flows

Each Figma screen becomes a route or a state of a route, assembled only from finished components; the clickable prototype is the specification for navigation. Build desktop and mobile of the same screen together, so one component tree serves both.

| Route | Desktop frames | Mobile frames |
| --- | --- | --- |
| `/sign-in`, `/sign-in/code` | Desktop · Sign in, Enter code | M1, M16, M17 |
| `/` (new chat) | Home, "+" menu, Voice, Files attached | M2, M3, M4, M18, M19 |
| `/c/[id]` (a chat) | Thinking, Best answer, Compare, Prompt 2 and 3 story | M5, M6, M8, M9, M20, M23–M33 |
| `/chats` | Chats, Search overlay (⌘K) | M14 |
| `/images` | Image studio, Picture ready | M21, M22 |
| `/presets` | Presets | M7, M25 (sheets) |
| `/wallet` | Wallet, Checkout, Payment received or failed, Go Pro, Pro is on | M10–M12, M34–M38 |
| `/settings/*` | Profile, Notifications, Privacy, Usage, Help | M13, M15, M39–M43 |

Steps for each route:

1. Give Claude Code the desktop frame link and the matching mobile frame links, plus the prototype flow it belongs to.
2. Build the layout from templates and organisms only. If something is missing, stop and add it as a component first (Phase 4 loop).
3. Wire real navigation exactly as the prototype: every tap target in Figma has a matching link or action in code.
4. Add all states the prototype shows: empty, thinking, failed, partial (1 of 3 answered), refunded, offline, low balance.
5. Check at 360, 412, 768, 1024 and 1440 px. Between Figma sizes, layouts must flex, not break.
6. Antigravity then opens the route in its browser and clicks through the same flow as the Figma prototype, reporting anything that differs.

Responsive rules to put in AGENTS.md:

- Below 768 px: bottom tabs, full-screen sheets, Compare shows one answer at a time with tabs and swipe.
- 768 to 1024 px: collapsible sidebar, Compare shows two columns (not designed in Figma yet; get a designer to sign it off).
- 1024 px and up: full desktop layout, Compare shows three columns.
- Touch targets at least 48 px on touch screens; body text never below 16 px on mobile.

## Phase 6 · Backend and integrations

The backend's job is to make the promises on screen true: answers are independent, failed answers cost nothing, and every credit is accounted for. Build it in parallel with Phases 4–5, preferably by Antigravity on its own branch, against typed API contracts agreed first.

1. **API contracts first.** Write the request and response types (Zod schemas) for every action the screens use: send prompt, stream answers, retry, swap model, top up, payment webhook, usage. Both agents code against these, so frontend and backend never drift.
2. **Auth.** Phone number + 6-digit SMS code through a Bangladesh SMS gateway, Google as an option. Rate-limit code requests and lock after repeated wrong codes.
3. **AI orchestration.**
   - Send the prompt to each selected model in parallel and stream each answer into its own column.
   - Each model gets only the user's prompts and its own earlier answers, never another model's answer.
   - Timeout per model at 30 seconds; mark it failed with a plain reason (timed out, provider down).
   - Catch-up: a model that missed a turn first receives the earlier user prompts, and that cost is shown as its own line.
   - Best answer: a final merge step that cites which model each part came from.
4. **Credits ledger.** An append-only table: every top-up, charge, refund and bonus is a row; the balance is the sum. Reserve an estimate when a prompt starts, charge actual tokens when each answer finishes, release the reserve for failed or stopped answers. Never edit or delete rows.
5. **Payments (PayStation: bKash, Nagad, card).** Create the payment on the server, redirect to the provider, and credit the wallet only from the verified webhook, never from the browser's return page. Make the webhook idempotent (the same payment ID twice must not credit twice). Show "Not charged" for anything that did not complete.
6. **Images.** One image provider behind the Image studio, with the cost shown before "Create picture".
7. **Notifications.** Payment receipts always on; low balance and "long answer ready" optional.
8. **Admin basics.** Look up a user, see their ledger, issue a manual refund with a reason. Support will need this from day one.

Keep every secret (AI keys, PayStation keys, SMS keys) on the server and in the host's secret store. No key ever reaches the browser or the repo.

## Phase 7 · Pixel-perfect QA

Pixel-perfect is enforced by a test that compares each screen to its Figma image, run on every pull request; eyes alone miss 2 px. Browsers and Figma render fonts slightly differently, so the goal is a tiny agreed threshold, not zero.

Set up the visual test once:

1. **Reference images.** Export every final frame and component state from Figma at 2x into `tests/visual/figma/`, named by route, state, theme and width (for example `wallet__default__light__1440.png`). Re-export when a frame changes.
2. **Same conditions.** Playwright opens the same route or story at the same viewport and device scale factor, with fonts loaded, animations and the light field blur frozen, and fixed demo data (the coffee-shop chat, 10,684 credits).
3. **Compare.** A pixel diff (pixelmatch) per image, with a diff image saved on failure. Start with: under 0.5% of pixels different per screen; tighten as the team gets closer.
4. **Fail the pull request** when a screen goes over the threshold. The diff image shows exactly where.
5. **Weekly overlay review.** A designer overlays the live build on Figma (a browser overlay extension at 50% opacity) for the screens that changed that week.

Everything else to check before calling a screen done:

- [ ] Light and Dark, both themes.
- [ ] English and Bangla, with long Bangla strings not overflowing.
- [ ] 360, 412, 768, 1024, 1440 px.
- [ ] Keyboard only: every action reachable, visible focus ring, Esc closes overlays.
- [ ] Screen reader labels on icon buttons; contrast 4.5:1 for text (automated with axe in Playwright).
- [ ] Reduced motion and reduced transparency respected.
- [ ] Real devices: a low-end Android phone on a slow connection, plus iPhone Safari.
- [ ] Performance: Lighthouse on mobile, fast first load on 3G-like speed.
- [ ] Every flow in the Figma prototype clicked through end to end (Antigravity's browser agent can do the first pass and report differences).

## Phase 8 · Launch

Launch to a small group on staging first, with real payments in sandbox, and only switch to live money after the ledger has balanced for a full week.

1. **Staging environment** that mirrors production: its own database, PayStation sandbox, real AI keys with low spending caps.
2. **Monitoring before users arrive:** error tracking, uptime checks on the AI and payment routes, and an alert when an AI provider's failure rate jumps.
3. **Product analytics** on the moments that matter: first question, Best answer vs Compare, retries, swaps, top-up started vs completed.
4. **Ledger check:** a daily job that compares the credits ledger with PayStation's settlement report and flags any mismatch.
5. **Closed beta** with 20 to 50 people, including people who are not tech-savvy, using their own phones. Watch them use it; fix what confuses them.
6. **Go live:** switch PayStation to live, raise AI spending caps, publish.
7. **After launch:** a weekly visual-test run against the latest Figma, and a rule that design changes start in Figma, then flow to code through the same loop.

## Daily loop and prompts

Small tasks, one branch each, and a pull request reviewed by you before merge; most mistakes from AI agents come from tasks that are too big.

Each day:

1. Pick the next 2 to 4 items from the checklist below.
2. Claude Code takes the UI items on one branch each; Antigravity takes backend or QA items on its own branch.
3. Each task starts with "plan first, then code" and ends with tests and a pull request.
4. Review the diff and the visual-test images yourself, then merge.
5. Update AGENTS.md whenever an agent repeats the same mistake twice.

Build a component (Claude Code):

```
Build the <Component name> component from this Figma node: <link>.
1. Read it with the Figma MCP: design context, screenshot and variables.
2. Plan the props from the Figma variant properties and list every state.
3. Build it in src/components/<level>/ using tokens only. Reuse existing components.
4. Add a Storybook story per state, in Light and Dark.
5. Export the Figma reference images and add a visual test.
6. Run the tests; fix until the visual diff passes. Then open a pull request.
```

Build a screen (Claude Code):

```
Build the <route> route from these frames: desktop <link>, mobile <links>.
Use only existing templates and components; list anything missing and stop.
Wire navigation exactly as the Figma prototype flow <flow name>.
Add all states: empty, loading, thinking, failed, partial, refunded.
Check 360, 412, 768, 1024 and 1440 px. Add visual tests per width and theme.
```

Check a flow (Antigravity):

```
Open http://localhost:3000 in the browser. Follow the flow "<flow name>":
<steps from the Figma prototype>. Screenshot each step at 1440 and 360 px.
Compare each with the Figma frames <links> and list every difference
(spacing, text, colour, missing state, wrong link). Do not change code.
```

Build a backend piece (Antigravity):

```
Implement <feature> against the contract in src/lib/<area>/contract.ts.
Follow AGENTS.md. Write unit tests first, then the code. Work on branch
<branch>. Never send one model's answer to another model.
```

## Master checklist

Tick these in order; nothing in a later group starts before the group above is done.

**Before code**

- [ ] Dev or Full Figma seat for the developer
- [ ] Figma cleanup list from Phase 0 done
- [ ] Decisions table filled in and agreed
- [ ] Accounts opened: GitHub, host, database, SMS gateway, PayStation sandbox, AI provider keys

**Tools**

- [ ] Claude Code installed, Figma plugin connected, test frame read successfully
- [ ] Playwright MCP added to Claude Code
- [ ] Antigravity installed; Figma desktop MCP connected or consciously skipped
- [ ] AGENTS.md, CLAUDE.md, `.agent/rules/project.md` written
- [ ] Saved prompts: `/build-component`, `/build-screen`, `/compare-to-figma`

**Foundation**

- [ ] Project scaffolded, CI green, branch protection on
- [ ] `tokens.css` generated from Figma (Light + Dark), Tailwind mapped, default palette off
- [ ] Fonts loaded (Geist, Geist Mono, Noto Sans Bengali), type classes match Figma
- [ ] Storybook Tokens page compared with Figma Tokens page
- [ ] Visual test pipeline working on one sample component

**UI**

- [ ] All atoms pass visual tests
- [ ] All molecules pass visual tests
- [ ] All organisms pass visual tests (Composer, Answer card and Sidebar included)
- [ ] Templates: App shell, Settings shell, Mobile shell
- [ ] Every route from the Phase 5 table, desktop and mobile
- [ ] Every prototype flow clicked through with no dead ends

**Backend**

- [ ] API contracts agreed
- [ ] Phone sign-in with SMS code and Google
- [ ] Parallel AI answers with streaming, 30 s timeouts, failure reasons
- [ ] Independence rule and catch-up implemented and tested
- [ ] Credits ledger with reserve, charge and refund
- [ ] PayStation payments with verified, idempotent webhooks
- [ ] Image studio, notifications, admin refund tool

**Quality and launch**

- [ ] Visual diffs under threshold on every screen, both themes, all widths
- [ ] Accessibility, Bangla, reduced motion, low-end Android checks passed
- [ ] Monitoring, analytics, daily ledger reconciliation
- [ ] Closed beta with non-technical users, fixes shipped
- [ ] Live payments switched on

## Sources

- [Claude Code overview and install](https://code.claude.com/docs/en/overview)
- [Figma MCP server guide](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Dev-Mode-MCP-Server)
- [Figma MCP rate limits and seats](https://developers.figma.com/docs/figma-mcp-server/rate-limits-access/)
- [Figma MCP setup for Claude Code](https://github.com/mcp/com.figma.mcp/mcp)
- [Antigravity and Figma MCP, community thread](https://forum.figma.com/ask-the-community-7/connecting-figma-mcp-server-with-google-antigravity-48325)
- [Antigravity MCP configuration](https://wikidocs.net/312519)
- [Antigravity rules and workflows](https://codemeetai.substack.com/p/antigravity-full-guide-from-install)
