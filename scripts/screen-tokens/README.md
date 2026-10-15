# Screen tokens

Values that Figma screens use but no Luminous token or component token provides (page title
sizes, screen-specific widths, the light field). They are read from the screen snapshots
`src/styles/figma/screens.json` (desktop) and `screens-mobile.json` (M-screens), never typed.

One file per area, each exporting `(TS) => [...]`:

```js
export default (TS) => [
  TS("wallet-title", "text", ["Wallet", "Wallet"]),
  TS("wallet-col", "size", ["Wallet", "B · Choose and pay"], "w"),
];
```

- `TS(name, kind, path, prop)`; `path` is the screen name, then child layer names
  (`"name#1"` picks the second layer with that name).
- kinds: `size` (Tailwind spacing `w-<name>`), `radius` (`rounded-<name>`), `stroke`, `opacity`,
  `blur` (`blur-<name>`), `text` (utility `type-<name>`).
- props: `w`, `h`, `x`, `y`, `radius`, `strokeWeight`, `gap`, `padX`, `padY`, `padLeft`,
  `opacity`, `blur`.
- Values equal to a Luminous token are aliased automatically; text equal to a Luminous text style
  becomes an alias of that style.

Run `npm run tokens` after editing. Inspect a screen with
`node scripts/figma-screen.mjs "<screen name>" [depth] [filter]`.
