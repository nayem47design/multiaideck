# Screens (Phase 5) — conventions

How routes are built from the Figma prototype. Read `AGENTS.md` first; this adds the screen-level rules.

## Sources (Figma is read-only)

| What | Where |
| --- | --- |
| Layer snapshot of every Light desktop screen and overlay | `src/styles/figma/screens.json` |
| Layer snapshot of every mobile screen M1–M43 | `src/styles/figma/screens-mobile.json` |
| Prototype tap targets → destinations | `src/styles/figma/prototype-flows.json` |
| Print a screen's layer tree | `node scripts/figma-screen.mjs "<screen>" [depth] [filter]` |

Snapshot keys: `n` name, `t` type, `x/y/w/h`, `al` auto layout `[dir, pt, pr, pb, pl, gap, main, cross]`, `r` radius, `sw` stroke weight, `f` fills, `s` strokes, `fx` effects, `c` text, `ts` text style (`raw <family> <style> <size>/<line height> ls<letter spacing>` when no style), `m` main component, `p` text props, `k` children.

Use the Figma bridge only to look at a frame (`figma_capture_screenshot` or a read-only `exportAsync`) and only one call at a time. Never write to Figma.

## Routes

```
src/app/[locale]/                 locale segment: English at /, Bangla at /bn (proxy.ts)
  layout.tsx                      <html>, fonts, theme script, NextIntlClientProvider
  _shell/                         AppFrame, AppSidebar, SidebarDrawer, MobileTabs, overlays.tsx
  _overlays/                      app-wide overlays: Search (⌘K), Go Pro, Pro is on, Sign out
  (app)/                          screens with the sidebar: /, /c/[id], /chats, /images, /presets
  (page)/                         screens with the Page top bar: /wallet, /settings/*
  (auth)/                         /sign-in, /sign-in/code
```

- A route's `page.tsx` is a server component: `await params`, `setRequestLocale(locale)`, then render the screen. Interactive parts live in a colocated `_components/` folder as client components.
- `cacheComponents` is on. Don't read `cookies()` or `headers()` in pages. Wrap a client component that calls `useSearchParams` in `<Suspense>`. Dynamic segments export `generateStaticParams` from the demo data.
- Links and routers come from `@/lib/i18n/navigation` (`Link`, `useRouter`, `usePathname`), never from `next/link` or `next/navigation`, so the locale is kept.
- `(app)` pages render `<AppMain composer footnote>` from `@/components/templates/AppShell` (scrolling content with the composer docked at the bottom) and their own `<LightField variant fixed />`.
- App-wide overlays open with `useOverlay().openOverlay("search" | "go-pro" | "pro-on" | "sign-out")`.

## Responsive

- ≥ 1024px: the desktop frame, sidebar shown.
- 768–1023px: the collapsed sidebar rail (Figma: Sidebar State=Collapsed); its Expand button opens the full sidebar as a drawer. Content flexes.
- ≥ 1024px the user can collapse the sidebar to the rail with its button or ⌘\; the choice is stored in localStorage and applied as `<html data-sidebar>` before first paint (`src/lib/sidebar.ts`). Style rail-only states with the `rail:` variant (`src/styles/effects.css`).
- < 768px: the M-screen layout. The bottom tab bar (Ask, Chats, Wallet, Account) shows only on `/`, `/chats`, `/wallet` and `/settings`; other screens use `MobileTopBar` with a back link. Sheets are full-width bottom sheets. Touch targets are at least 48px; body text is at least 16px.
- Build desktop and mobile from one component tree: switch layout with `md:` and `lg:` classes, not separate pages. Check 360, 412, 768, 1024 and 1440px.
- `<LightField>` swaps to the mobile field below 768px by itself.

## Copy (en + bn)

- No text in components. Each area owns its top-level namespaces in `src/messages/en.json` and `bn.json`. Write a namespace's English and Bangla JSON to temporary files, then run:
  `node scripts/set-messages.mjs <namespace> <en.json> <bn.json>`. It checks that both files have the same keys and sorts the namespaces.
- Shared namespaces already exist: `common` (brand, footnote, credits/money formats, language names), `nav` (sidebar and tab bar).
- Format numbers with `useFormatter().number()` so Bangla shows Bangla digits. Brand and model names are not translated.
- User content (chat titles, prompts, AI answers, names) is demo data in `src/lib/mock/`, not messages.

## Tokens

- Tokens only, as in `AGENTS.md`. A value a screen needs that no token provides goes in `scripts/screen-tokens/<area>.mjs` as a `TS(...)` entry read from the snapshot, never typed; then run `npm run tokens`. See `scripts/screen-tokens/README.md`.
- Figma screens use many raw text styles (`raw Geist Light 40/46 ls-1.2`). Add them as `text` screen tokens; the generator aliases those equal to a Luminous style.

## Components

- Reuse `src/components` first. A piece a screen needs that a component doesn't cover yet becomes a new molecule or organism with a story. Mobile-only pieces (for example `MobileTopBar`, `MobileTabBar`) are components too.
- Change an existing component only by adding optional props, so its stories and visual tests keep passing.

## Demo data

`src/lib/mock/demo.ts` holds the user, balance, chat list and model names (the coffee-shop chat, 10,684 credits). Area-specific data goes in `src/lib/mock/<area>.ts`.

## Done means

- Every tap target in `prototype-flows.json` for the screen has a matching link or action.
- All prototype states exist (empty, thinking, failed, partial, refunded, and so on).
- Light and Dark, English and Bangla (`/bn/...`), at 360, 412, 768, 1024 and 1440px.
- `npm run typecheck` and `npm run lint` pass.
