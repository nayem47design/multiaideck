# QA (Phase 7) — how screens are checked

Pixel-perfect is enforced by tests on every pull request (`.github/workflows/ci.yml`); people
check what a test can't.

## Automated

| Check | Command | What it does |
| --- | --- | --- |
| Components vs Figma | `npm run test:visual` | Every component variant (Light, Dark) vs its Figma export, < 3% pixels |
| Screens vs Figma | `npm run test:screens` | Every Prototype frame vs the same route and state in the app |
| User flows | `npm run test:e2e` | The prototype's journeys, every route in en and bn, desktop and phone |
| Accessibility | `npm run test:a11y` | axe (WCAG 2.2 AA, contrast) in Light/Dark and en/bn, Esc closes overlays, focus ring, reduced motion and transparency, touch targets |
| Performance | `npm run lighthouse` | Lighthouse, mobile, slow-4G simulation (with the app running) |

### Screen references

- `tests/visual/figma/screens/<slug>__<theme>__<width>.png`, with `frames.json` (Figma node id per file). Exported read-only from the Figma Prototype page: desktop at 1x (a 1440-wide frame already holds every design pixel, and it keeps the repo small), mobile at 2x.
- `tests/visual/screens.manifest.ts` says how to reach each frame in the app (route, deep link or clicks, dialog element). A frame without an entry fails the run, so new frames can't be forgotten.
- Same conditions: the same viewport and scale, fonts loaded, animations frozen, signed in as the demo user with the prototype's data (the coffee-shop chat, 10,684 credits). Mobile references have the drawn phone status bar cropped.
- Re-export a frame when it changes in Figma and update `frames.json`.

### Threshold

- 3% of pixels per image (AGENTS.md rule 5), the same as components. Figma and Chrome rasterise Geist differently, so zero isn't reachable. Tighten as the team gets closer.
- On failure, Playwright attaches `figma.png`, `code.png` and `diff.png`; CI uploads them.

## By people

- **Weekly overlay review.** A designer overlays the live build on Figma (a browser overlay extension at 50% opacity) for the screens that changed that week, and files differences.
- **Real devices.** A low-end Android phone on a slow connection, and iPhone Safari: sign in, ask, compare, top up.
- **Bangla.** Long Bangla strings don't overflow or truncate badly. The e2e suite checks there's no sideways scroll in `/bn`.
- **Screen reader.** TalkBack (Android) and VoiceOver on the sign-in, ask and top-up flows.
