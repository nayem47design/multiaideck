// Screen tokens shared by every screen: the light field, the mobile tab bar and top bar.
// TS(name, kind, [screen, ...layer names], prop): see scripts/screen-tokens/README.md.

export default (TS) => [
  // Light field: blurred ellipses behind each screen. One set per Figma variant.
  ...[
    ["app", ["Home", "Light field"], "light field", 3],
    ["dimmed", ["Best answer", "Light field (dimmed)"], "light field", 2],
    ["page", ["Settings · Profile"], "Ellipse", 2],
    ["wallet", ["Wallet"], "Ellipse", 2],
    ["auth", ["Desktop · Sign in"], "Light field", 1],
    ["mobile", ["M2 · Home"], "Light field", 1],
  ].flatMap(([variant, parent, layer, count]) =>
    Array.from({ length: count }, (_, i) => {
      const path = [...parent, `${layer}#${i}`];
      const name = `field-${variant}-${i + 1}`;
      return [
        TS(`${name}-w`, "size", path, "w"),
        TS(`${name}-h`, "size", path, "h"),
        TS(`${name}-x`, "size", path, "x"),
        TS(`${name}-y`, "size", path, "y"),
        TS(name, "blur", path, "blur"),
        TS(`${name}-opacity`, "opacity", path, "opacity"),
      ];
    }).flat(),
  ),
  // Mobile tab bar and top bar (drawn on every M-screen; read from M2 and M5).
  TS("tab-bar-height", "size", ["M2 · Home", "Tab bar"], "h"),
  TS(
    "tab-indicator-w",
    "size",
    ["M2 · Home", "Tab bar", "Tab · Ask", "indicator"],
    "w",
  ),
  TS(
    "tab-indicator-h",
    "size",
    ["M2 · Home", "Tab bar", "Tab · Ask", "indicator"],
    "h",
  ),
  TS(
    "tab-indicator",
    "radius",
    ["M2 · Home", "Tab bar", "Tab · Ask", "indicator"],
    "radius",
  ),
  TS(
    "tab-icon",
    "size",
    ["M2 · Home", "Tab bar", "Tab · Ask", "indicator", "Icon/ai-magic"],
    "w",
  ),
  TS("tab-label", "text", ["M2 · Home", "Tab bar", "Tab · Chats", "Chats"]),
  TS("mobile-top-bar-height", "size", ["M5 · Best answer", "Top bar"], "h"),
  TS("mobile-top-bar-pad", "size", ["M5 · Best answer", "Top bar"], "padX"),
  TS("mobile-tap", "size", ["M5 · Best answer", "Top bar", "Tap · left"], "w"),
  TS(
    "mobile-tap-icon",
    "size",
    ["M5 · Best answer", "Top bar", "Tap · left", "Icon/arrow-left-01"],
    "w",
  ),
  TS("mobile-gutter", "size", ["M5 · Best answer", "Answer"], "x"),
  TS("screen-desktop", "size", ["Home"], "w"),
  TS("screen-mobile", "size", ["M2 · Home"], "w"),
];
