# AGENTS.md — MultiAIDeck (multiaideck.com)

Shared rules for every coding agent (Claude Code, Antigravity). Full plan: `docs/BUILD_GUIDE.md`.

## Product

Ask one prompt, get answers from several AI models side by side (3 by default, up to 6), pick the best, pay with credits. Users are in Bangladesh: English + Bangla, PayStation (bKash, Nagad, card), many non-technical users on low-end Android phones.

## Stack

Next.js (App Router) + TypeScript strict · Tailwind on CSS-variable tokens (default palette off) · Radix UI · Motion · `next/font` (Geist, Geist Mono, Noto Sans Bengali) · next-intl (en, bn) · Vercel AI SDK · Postgres + Drizzle + Zod · Storybook · Vitest · Playwright (+ pixel diff vs Figma) · ESLint, Prettier, Husky.

## Folder structure

```
src/
  app/                  routes: (auth) (app) settings wallet api
  components/
    atoms/  molecules/  organisms/  templates/
  styles/
    tokens.css          generated from Figma variables (Light + Dark)
    typography.css      text styles as classes
  lib/                  ai/, billing/, payments/, auth/, i18n/
  messages/             en.json, bn.json
tests/
  visual/               Figma reference images + comparison tests
  e2e/                  user flows from the prototype
.storybook/
```

## Rules

1. **Figma is the source of truth and is read-only.** Before building any UI, read the Figma node (component details, variables, screenshot) through the Figma bridge. Never edit the Figma file. File key `fCrR78u1aj0DQjzpaEhrIY`; node IDs are in `CLAUDE.md`.
2. **Tokens only.** Never hard-code a colour, size, spacing, radius, shadow, duration or font. Use `src/styles/tokens.css` via Tailwind theme classes.
3. **Reuse before creating.** Check `src/components` first. Build bottom-up: atoms → molecules → organisms → templates → screens.
4. **Props mirror Figma variants** (`variant`, `size`, `state`). Add hover, focus, pressed, disabled and loading states even if Figma lacks them, and list them in the PR for the designer.
5. **Done means visually verified.** Every component has a Storybook story per state, in Light and Dark, and a visual test against its Figma screenshot (< 3% pixel difference; raised from 0.5% because Figma and Chrome render text differently).
6. **No text in components.** All copy goes through `messages/en.json` and `messages/bn.json`.
7. **Each answer is independent.** Never send one model's answer to another model, including in follow-ups and retries after a failure.
8. **Credits use an append-only ledger.** Never update or delete ledger rows; write corrections as new entries.
9. **Secrets stay out of the repo.** Read them from the environment (`.env` is git-ignored).
10. **Git:** work on a branch, small PRs, never push to `main`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
