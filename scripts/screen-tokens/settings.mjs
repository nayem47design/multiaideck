// Screen tokens for Settings (desktop "Settings · *" screens, the Sign out overlay) and the Account
// area on mobile (M13, M15, M39–M43). TS(name, kind, [screen, ...layer names], prop): see README.

const P = "Settings · Profile";
const U = "Settings · Usage";
const H = "Settings · Help & support";
const M15 = "M15 · Account & settings";
const M13 = "M13 · Usage";
const M42 = "M42 · Help & support";

const screenTokens = (TS) => [
  // Desktop page header and section titles
  TS("settings-title", "text", [P, "Profile"]),
  TS("settings-subtitle", "text", [
    P,
    "How you appear, and how MultiAI talks to you.",
  ]),
  TS("settings-section-title", "text", [U, "Where your credits went"]),
  TS("settings-account-label", "text", [
    P,
    "Content",
    "Account row",
    "Account",
  ]),
  TS("settings-link", "text", [P, "Content", "Account row", "Sign out"]),
  TS("settings-save-bar-width", "size", [P, "Save bar"], "w"),

  // Usage: summary strip and the daily spend chart
  TS("usage-period-height", "size", [U, "Period"], "h"),
  TS(
    "usage-stat-pad",
    "size",
    [U, "Usage summary", "Stat/CREDITS SPENT"],
    "padX",
  ),
  TS(
    "usage-chart-height",
    "size",
    [U, "Daily spend card", "Bars · Oct 1–14"],
    "h",
  ),
  TS(
    "usage-chart-bar-width",
    "size",
    [U, "Daily spend card", "Bars · Oct 1–14", "Oct 14#0"],
    "w",
  ),
  TS(
    "usage-chart-bar-max",
    "size",
    [U, "Daily spend card", "Bars · Oct 1–14", "Oct 14#0"],
    "h",
  ),
  TS(
    "usage-chart-bar-empty",
    "size",
    [U, "Daily spend card", "Bars · Oct 1–14", "Oct 2"],
    "h",
  ),
  TS(
    "usage-chart-label-height",
    "size",
    [U, "Daily spend card", "Bars · Oct 1–14", "Oct 1#1"],
    "h",
  ),

  // Help & support: contact cards and FAQ
  TS("help-contact-title", "text", [
    H,
    "Content",
    "Contact",
    "Contact · Chat with us",
    "Chat with us",
  ]),
  TS(
    "help-contact-pad",
    "size",
    [H, "Content", "Contact", "Contact · Chat with us"],
    "padX",
  ),
  TS(
    "help-contact-gap",
    "size",
    [H, "Content", "Contact", "Contact · Chat with us"],
    "gap",
  ),
  TS(
    "help-contact-tile",
    "size",
    [H, "Content", "Contact", "Contact · Chat with us", "tile"],
    "w",
  ),
  TS(
    "help-contact-tile",
    "radius",
    [H, "Content", "Contact", "Contact · Chat with us", "tile"],
    "radius",
  ),
  TS(
    "help-contact-tile-icon",
    "size",
    [
      M42,
      "Content",
      "Contact",
      "Contact · Chat with us",
      "tile",
      "Icon/bubble-chat",
    ],
    "w",
  ),
  TS(
    "help-contact-button-height",
    "size",
    [H, "Content", "Contact", "Contact · Chat with us", "Button · Start chat"],
    "h",
  ),
  TS(
    "help-contact-button-pad",
    "size",
    [H, "Content", "Contact", "Contact · Chat with us", "Button · Start chat"],
    "padX",
  ),
  TS("help-contact-button", "text", [
    H,
    "Content",
    "Contact",
    "Contact · Chat with us",
    "Button · Start chat",
    "Start chat",
  ]),
  TS("help-group-label", "text", [H, "Content", "Common questions"]),
  TS("help-faq-pad", "size", [H, "Content", "FAQ"], "padX"),
  TS(
    "help-faq-row-height",
    "size",
    [H, "Content", "FAQ", "Q · Why didn’t one of the AIs answer?"],
    "h",
  ),
  TS(
    "help-faq-row-pad",
    "size",
    [H, "Content", "FAQ", "Q · Why didn’t one of the AIs answer?"],
    "padX",
  ),
  TS("help-faq-question", "text", [
    H,
    "Content",
    "FAQ",
    "Q · Why didn’t one of the AIs answer?",
    "Why didn’t one of the AIs answer?",
  ]),
  TS(
    "help-faq-icon",
    "size",
    [H, "Content", "FAQ", "Q · Can I ask in Bangla?", "Icon/arrow-down-01"],
    "w",
  ),

  // Sign out overlay (desktop dialog)
  TS("sign-out-width", "size", ["Overlay · Sign out"], "w"),
  TS("sign-out-pad", "size", ["Overlay · Sign out"], "padX"),
  TS("sign-out-gap", "size", ["Overlay · Sign out"], "gap"),
  TS("sign-out-title", "text", ["Overlay · Sign out", "Sign out of MultiAI?"]),
  TS("sign-out-actions-gap", "size", ["Overlay · Sign out", "Actions"], "gap"),

  // Mobile account (M15): cards, rows, text size picker
  TS("acct-card-pad", "size", [M15, "Content", "Reading"], "padX"),
  TS("acct-profile-pad", "size", [M15, "Content", "Profile"], "padX"),
  TS("acct-profile-avatar", "size", [M15, "Content", "Profile", "avatar"], "w"),
  TS(
    "acct-profile-chevron",
    "size",
    [M15, "Content", "Profile", "Icon/arrow-right-01"],
    "w",
  ),
  TS("acct-row-label", "text", [
    M15,
    "Content",
    "Settings list",
    "Row · Language",
    "Language",
  ]),
  TS(
    "acct-row-height",
    "size",
    [M15, "Content", "Settings list", "Row · Language"],
    "h",
  ),
  TS(
    "acct-row-icon",
    "size",
    [M15, "Content", "Settings list", "Row · Language", "Icon/globe-02"],
    "w",
  ),
  TS(
    "acct-row-chevron",
    "size",
    [M15, "Content", "Settings list", "Row · Language", "Icon/arrow-right-01"],
    "w",
  ),
  TS("acct-sign-out-height", "size", [M15, "Content", "Sign out"], "h"),
  TS(
    "acct-text-size-options-height",
    "size",
    [M15, "Content", "Reading", "Text size", "Size options"],
    "h",
  ),
  TS(
    "acct-text-size-option-height",
    "size",
    [M15, "Content", "Reading", "Text size", "Size options", "Size · Large"],
    "h",
  ),
  TS("acct-text-size-xsmall", "text", [
    M15,
    "Content",
    "Reading",
    "Text size",
    "Size options",
    "Size · Extra small",
    "Extra small",
  ]),
  TS("acct-text-size-small", "text", [
    M15,
    "Content",
    "Reading",
    "Text size",
    "Size options",
    "Size · Small",
    "Small",
  ]),
  TS("acct-text-size-normal", "text", [
    M15,
    "Content",
    "Reading",
    "Text size",
    "Size options",
    "Size · Normal",
    "Normal",
  ]),
  TS("acct-text-size-large", "text", [
    M15,
    "Content",
    "Reading",
    "Text size",
    "Size options",
    "Size · Large",
    "Large",
  ]),
  TS("acct-text-size-larger", "text", [
    M15,
    "Content",
    "Reading",
    "Text size",
    "Size options",
    "Size · Larger",
    "Larger",
  ]),
  TS("acct-text-size-current", "text", [
    M15,
    "Content",
    "Reading",
    "Text size",
    "Header",
    "Current size",
  ]),

  // Mobile usage (M13)
  TS("acct-usage-card-pad", "size", [M13, "Content", "Total"], "padX"),
  TS("acct-usage-total", "text", [M13, "Content", "Total", "t", "26 credits"]),
  TS("acct-card-title", "text", [
    M13,
    "Content",
    "By AI",
    "Which AIs used your credits",
  ]),
  TS(
    "acct-usage-track",
    "size",
    [M13, "Content", "By AI", "AI · GPT-5", "track"],
    "h",
  ),
  TS(
    "acct-usage-track",
    "radius",
    [M13, "Content", "By AI", "AI · GPT-5", "track"],
    "radius",
  ),
  TS("acct-period-height", "size", [M13, "Top bar", "Period"], "h"),

  // Mobile bottom sheets (M39 Language, M43 Sign out?)
  TS(
    "acct-sheet-pad-top",
    "size",
    ["M39 · Language", "Language sheet"],
    "padY",
  ),
  TS(
    "acct-sheet-grabber-width",
    "size",
    ["M39 · Language", "Language sheet", "Grabber row", "grabber"],
    "w",
  ),
  TS(
    "acct-sheet-grabber-height",
    "size",
    ["M39 · Language", "Language sheet", "Grabber row", "grabber"],
    "h",
  ),
  TS("acct-sheet-gap", "size", ["M39 · Language", "Language sheet"], "gap"),
  TS(
    "acct-sheet-option-height",
    "size",
    ["M39 · Language", "Language sheet", "Option · English"],
    "h",
  ),
  TS(
    "acct-sheet-option",
    "radius",
    ["M39 · Language", "Language sheet", "Option · English"],
    "radius",
  ),
  TS("acct-sheet-option-title", "text", [
    "M39 · Language",
    "Language sheet",
    "Option · English",
    "t",
    "English",
  ]),
  TS(
    "acct-sheet-button-height",
    "size",
    ["M39 · Language", "Language sheet", "Button · Done"],
    "h",
  ),
];

export default screenTokens;
