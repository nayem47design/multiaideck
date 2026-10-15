// Generates component tokens: values that Figma components use but the Luminous variables
// and text styles do not provide (agreed: read them from Figma, never type them by hand).
//
//   src/styles/figma/components.json   component specs, exported from Figma (read-only)
//   src/styles/figma/screens*.json     screen layer snapshots (desktop and mobile), for TS(...)
//   src/styles/figma/luminous.*.json   the Luminous tokens, to alias equal values
//
// Output: src/styles/components.css (CSS variables, Tailwind mapping, text utilities) and
// src/styles/component-tokens.md (the list for the designer: every off-token value and where
// it comes from). Run `npm run tokens`.

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const stylesDir = join(root, "src/styles");
const read = (f) => JSON.parse(readFileSync(join(stylesDir, f), "utf8"));
const { components } = read("figma/components.json");
const variables = read("figma/luminous.tokens.json");
const styles = read("figma/luminous.styles.json");
const { textStyles } = styles;
const templateSnapshot = read("figma/templates.json");
const screens = {
  ...read("figma/screens.json").screens,
  ...read("figma/screens-mobile.json").screens,
};

// ---------------------------------------------------------------------------
// Which values each component needs. Selectors name Figma layers; values come from Figma.
//   path: [component, variant?, ...child layer names]; prop: w | h | x | y | radius | strokeWeight | gap |
//     padX (right) | padLeft | padY (top) | padBottom | opacity
//   kind: size (Tailwind spacing), radius, stroke, opacity, text, gradient, color

const T = (name, kind, path, prop) => ({ name, kind, path, prop });
/** A layout size measured from the template snapshot: fn(template children) at Figma's scale. */
const TL = (name, path, fn) => ({ name, kind: "size", template: path[0], fn });
/** A value read from a screen layer (screens.json / screens-mobile.json); path starts with the screen name. */
const TS = (name, kind, path, prop) => ({
  name,
  kind,
  path,
  prop,
  screen: true,
});

// Screen tokens live in scripts/screen-tokens/<area>.mjs, each `export default (TS) => [...]`,
// so different screens can add tokens without editing this file.
const screenTokenDir = join(root, "scripts/screen-tokens");
const screenTokens = [];
for (const file of readdirSync(screenTokenDir)
  .filter((f) => f.endsWith(".mjs"))
  .sort()) {
  const mod = await import(join(screenTokenDir, file));
  screenTokens.push(...mod.default(TS));
}

const TOKENS = [
  T(
    "icon-button-icon",
    "size",
    ["Icon button", "Style=Plain", "Icon/add-01"],
    "w",
  ),

  T("filter-pill-height", "size", ["Filter pill", "State=Default"], "h"),
  T("filter-pill", "text", ["Filter pill", "State=Default", "Label"]),

  T("badge-dot", "size", ["Badge", "Tone=Neutral", "dot"], "w"),
  T("badge", "text", ["Badge", "Tone=Neutral", "Label"]),

  T("toggle-width", "size", ["Toggle", "State=On"], "w"),
  T("toggle-height", "size", ["Toggle", "State=On"], "h"),
  T("toggle-knob", "size", ["Toggle", "State=On", "knob"], "w"),
  T("toggle-inset", "size", ["Toggle", "State=Off", "knob"], "x"),

  T("checkbox-size", "size", ["Checkbox", "State=Unchecked"], "w"),
  T("checkbox", "radius", ["Checkbox", "State=Unchecked"], "radius"),
  T(
    "checkbox-border",
    "stroke",
    ["Checkbox", "State=Unchecked"],
    "strokeWeight",
  ),
  T(
    "checkbox-icon",
    "size",
    ["Checkbox", "State=Checked", "Icon/tick-02"],
    "w",
  ),

  T("radio-size", "size", ["Radio", "State=Unselected"], "w"),
  T("radio-border", "stroke", ["Radio", "State=Unselected"], "strokeWeight"),
  T("radio-ring", "stroke", ["Radio", "State=Selected"], "strokeWeight"),

  T("orb-lg", "size", ["Model orb", "Model=GPT, Size=lg"], "w"),
  T("orb-md", "size", ["Model orb", "Model=GPT, Size=md"], "w"),
  T("orb-sm", "size", ["Model orb", "Model=GPT, Size=sm"], "w"),
  T("orb-ring", "stroke", ["Model orb", "Model=GPT, Size=lg"], "strokeWeight"),
  T("orb-ring", "color", ["Model orb", "Model=GPT, Size=lg"], "stroke"),
  T(
    "orb-initial",
    "color",
    ["Model orb", "Model=GPT, Size=lg", "Initial"],
    "fill",
  ),
  T("orb-lg", "text", ["Model orb", "Model=GPT, Size=lg", "Initial"]),
  T("orb-md", "text", ["Model orb", "Model=GPT, Size=md", "Initial"]),
  ...["GPT", "Claude", "Gemini", "DeepSeek", "Grok"].map((m) =>
    T(
      `orb-${m.toLowerCase()}`,
      "gradient",
      ["Model orb", `Model=${m}, Size=lg`],
      "fill",
    ),
  ),

  T("avatar-size", "size", ["Avatar"], "w"),
  T("avatar", "text", ["Avatar", "Initials"]),

  T("input-height", "size", ["Input", "State=Default"], "h"),
  T("input-border", "stroke", ["Input", "State=Default"], "strokeWeight"),
  T("input-border-focus", "stroke", ["Input", "State=Focus"], "strokeWeight"),
  T("input", "text", ["Input", "State=Default", "Value"]),

  T("metric-chip", "text", ["Metric chip", "Value"]),

  T("ai-orb-size", "size", ["AI orb"], "w"),
  T("ai-orb-ring", "stroke", ["AI orb"], "strokeWeight"),
  T("ai-orb-ring", "color", ["AI orb"], "stroke"),
  T("ai-orb", "gradient", ["AI orb"], "fill"),

  T(
    "text-link-icon",
    "size",
    ["Text link", "Style=Default", "Icon/link-square-02"],
    "w",
  ),
  T("text-link", "text", ["Text link", "Style=Default", "Label"]),

  T("thinking-dot", "size", ["Thinking dots", "dot"], "w"),
  T("thinking-dot-2", "opacity", ["Thinking dots", "dot#1"], "opacity"),
  T("thinking-dot-3", "opacity", ["Thinking dots", "dot#2"], "opacity"),

  T("progress-height", "size", ["Progress bar", "State=In progress"], "h"),

  T("skeleton-line", "size", ["Skeleton", "line"], "h"),
  T("skeleton-line", "radius", ["Skeleton", "line"], "radius"),

  T("shortcut-chip", "radius", ["Shortcut chip"], "radius"),
  T("shortcut-chip", "text", ["Shortcut chip", "Keys"]),

  T(
    "payment-logo-icon",
    "size",
    ["Payment logo slot", "Method=Card", "Icon/credit-card"],
    "w",
  ),
  // ---- Molecules
  T(
    "segmented-option-height",
    "size",
    ["Segmented control", "Selected=First", "Option 1"],
    "h",
  ),
  T("segmented-option", "shadow", [
    "Segmented control",
    "Selected=First",
    "Option 1",
  ]),
  T("segmented-option", "text", [
    "Segmented control",
    "Selected=First",
    "Option 1",
    "Label",
  ]),

  T("search-field", "text", ["Search field", "Placeholder"]),

  T("nav-item", "text", ["Nav item", "State=Default, Trailing=None", "Label"]),
  T("nav-item-selected", "text", [
    "Nav item",
    "State=Selected, Trailing=None",
    "Label",
  ]),
  T(
    "nav-item-trailing-icon",
    "size",
    ["Nav item", "State=Default, Trailing=External", "Icon/link-square-02"],
    "w",
  ),

  T("model-chip-orb", "size", ["Model chip", "Model orb"], "w"),
  T("model-chip-remove-icon", "size", ["Model chip", "Icon/cancel-01"], "w"),
  T("model-chip", "text", ["Model chip", "Label"]),

  T("stepper-icon", "size", ["Stepper", "minus", "Icon/minus-sign"], "w"),
  T("stepper", "text", ["Stepper", "value", "Value"]),

  T("field-label", "text", ["Field", "Label"]),
  T("field-help", "text", ["Field", "Help"]),

  T("setting-row-title", "text", ["Setting row", "t", "Title"]),
  T("setting-row-help", "text", ["Setting row", "t", "Help"]),

  T("pack-row-height", "size", ["Pack row"], "h"),
  T("pack-row", "radius", ["Pack row"], "radius"),
  T("pack-row-price", "text", ["Pack row", "Price"]),
  T("pack-row-credits", "text", ["Pack row", "Credits"]),

  T("toast", "shadow", ["Toast", "Tone=Success"]),
  T("toast-icon", "size", ["Toast", "Tone=Success", "Icon/tick-02"], "w"),
  T("toast", "text", ["Toast", "Tone=Success", "Message"]),

  T("select-width", "size", ["Select", "State=Default"], "w"),
  T(
    "select-icon",
    "size",
    ["Select", "State=Default", "Icon/arrow-down-01"],
    "w",
  ),
  T("select-border-open", "stroke", ["Select", "State=Open"], "strokeWeight"),
  T("select", "text", ["Select", "State=Default", "Value"]),

  T("citation-chip-height", "size", ["Citation chip"], "h"),
  T("citation-chip-dot", "size", ["Citation chip", "dot"], "w"),
  T("citation-chip", "text", ["Citation chip", "Label"]),

  T("tooltip-width", "size", ["Tooltip", "Size=Default"], "w"),
  T("tooltip", "radius", ["Tooltip", "Size=Default"], "radius"),
  T("tooltip-title", "text", ["Tooltip", "Size=Default", "Title"]),
  T("tooltip-body", "text", ["Tooltip", "Size=Default", "Body"]),

  T(
    "banner-icon",
    "size",
    ["Banner", "Tone=Info", "Icon/information-circle"],
    "w",
  ),
  T("banner-title", "text", ["Banner", "Tone=Info", "t", "Title"]),
  T("banner-body", "text", ["Banner", "Tone=Info", "t", "Body"]),

  T("empty-state-icon-circle", "size", ["Empty state", "icon"], "w"),
  T(
    "empty-state-icon",
    "size",
    ["Empty state", "icon", "Icon/bubble-chat"],
    "w",
  ),
  T("empty-state-title", "text", ["Empty state", "Title"]),
  T("empty-state-body", "text", ["Empty state", "Body"]),

  T("model-list-row-height", "size", ["Model list row", "State=Default"], "h"),
  T(
    "model-list-row-info",
    "size",
    ["Model list row", "State=Default", "t"],
    "w",
  ),
  T("model-list-row-name", "text", [
    "Model list row",
    "State=Default",
    "t",
    "Name",
  ]),
  T("model-list-row-provider", "text", [
    "Model list row",
    "State=Default",
    "t",
    "Provider",
  ]),
  T("model-list-row-tag", "text", [
    "Model list row",
    "State=Default",
    "tags",
    "tag",
    "Balanced",
  ]),
  T("model-list-row-cost", "text", ["Model list row", "State=Default", "Cost"]),

  T(
    "cost-estimate-icon",
    "size",
    ["Cost estimate", "Icon/information-circle"],
    "w",
  ),
  T("cost-estimate", "text", ["Cost estimate", "Value"]),

  T("prompt-bubble", "shadow", ["Prompt bubble"]),
  T("prompt-bubble", "text", [
    "Prompt bubble",
    "Give me 3 name ideas for a small coffee shop in Dhaka",
  ]),

  T("chat-title-pill", "shadow", ["Chat title pill"]),
  T(
    "chat-title-pill-icon",
    "size",
    ["Chat title pill", "Icon/arrow-down-01"],
    "w",
  ),
  T("chat-title-pill", "text", ["Chat title pill", "Coffee shop names"]),

  T("prompt-receipt-height", "size", ["Prompt receipt"], "h"),
  T("prompt-receipt", "text", [
    "Prompt receipt",
    "This prompt: 3 models · 2.6 credits · ≈ BDT 0.03",
  ]),
  T("prompt-receipt-secondary", "text", [
    "Prompt receipt",
    "Cheapest: Gemini (0.3 cr)",
  ]),

  T("save-bar", "shadow", ["Save bar"]),
  T("save-bar-height", "size", ["Save bar"], "h"),
  T("save-bar-discard-height", "size", ["Save bar", "Pill/Discard"], "h"),
  T("save-bar-message", "text", ["Save bar", "You changed your display name"]),
  T("save-bar-save", "text", ["Save bar", "Save (black pill)", "Save changes"]),
  // ---- Organisms · group 1
  T("answer-card-width", "size", ["Answer card", "State=Default"], "w"),
  T("answer-card-height", "size", ["Answer card", "State=Default"], "h"),
  T("answer-card", "radius", ["Answer card", "State=Default"], "radius"),
  T("answer-card", "shadow", ["Answer card", "State=Default"]),
  T(
    "answer-card-border-suggested",
    "stroke",
    ["Answer card", "State=Suggested"],
    "strokeWeight",
  ),
  T("answer-card-model", "text", [
    "Answer card",
    "State=Default",
    "Header",
    "name",
    "nr",
    "Model name",
  ]),
  T("answer-card-answer", "text", [
    "Answer card",
    "State=Default",
    "Answer body",
    "Answer",
  ]),
  T(
    "answer-card-failure",
    "radius",
    ["Answer card", "State=Failed", "Answer body", "Failure icon"],
    "radius",
  ),

  T("composer", "radius", ["Composer", "State=Default"], "radius"),
  T("composer", "shadow", ["Composer", "State=Default"]),
  T("composer-input", "text", ["Composer", "State=Default", "Placeholder"]),
  T(
    "composer-orb-overlap",
    "size",
    ["Composer", "State=Default", "Toolbar", "Model picker", "model dots"],
    "gap",
  ),
  T(
    "composer-file-tile",
    "radius",
    [
      "Composer",
      "State=Attachment",
      "Attachments",
      "File · Menu-draft.pdf",
      "type tile",
    ],
    "radius",
  ),
  T(
    "composer-file-width",
    "size",
    ["Composer", "State=Attachment", "Attachments", "File · Menu-draft.pdf"],
    "w",
  ),
  T(
    "composer-file-text",
    "size",
    [
      "Composer",
      "State=Attachment",
      "Attachments",
      "File · Menu-draft.pdf",
      "text",
    ],
    "w",
  ),
  T(
    "composer-wave-bar",
    "size",
    ["Composer", "State=Voice listening", "Toolbar", "Waveform", "bar"],
    "w",
  ),

  T("composer-menu-width", "size", ["Composer menu"], "w"),

  T("suggestion-bar", "shadow", ["Suggestion bar"]),
  T(
    "suggestion-bar-orb",
    "size",
    ["Suggestion bar", "mini constellation", "Model orb"],
    "w",
  ),
  T("suggestion-bar-why-height", "size", ["Suggestion bar", "Pill/Why?"], "h"),

  T("page-top-bar", "shadow", ["Page top bar"]),
  T("page-top-bar-height", "size", ["Page top bar"], "h"),
  T("page-top-bar-title", "text", ["Page top bar", "Wallet"]),

  // Sidebar (component set since the collapsible rail): read from State=Expanded, which is now
  // built from Sidebar section header, Project row, Chat row and Credits instances.
  ...(() => {
    const ex = ["Sidebar", "State=Expanded"];
    return [
      T("sidebar-width", "size", ex, "w"),
      T("sidebar", "shadow", ex),
      T("sidebar-pad-top", "size", ex, "padY"),
      T(
        "sidebar-brand-orb",
        "size",
        [...ex, "Brand row", "brand", "AI orb"],
        "w",
      ),
      T("sidebar-brand", "text", [...ex, "Brand row", "brand", "MultiAI"]),
      // Also used by Model picker, Activity table and Recent usage.
      T("sidebar-section", "text", [...ex, "Today header", "Label"]),
      T(
        "sidebar-chat-orb-overlap",
        "size",
        [...ex, "Coffee shop names", "orbs", "models"],
        "gap",
      ),
      T("sidebar-actions-gap", "size", [...ex, "g"], "h"),
      T("sidebar-actions-gap-between", "size", [...ex, "Actions"], "gap"),
      T("sidebar-new-chat-gap", "size", [...ex, "Actions", "New chat"], "gap"),
      T("sidebar-new-chat", "text", [...ex, "Actions", "New chat", "New chat"]),
      T(
        "sidebar-search-icon",
        "size",
        [...ex, "Actions", "Search", "Icon/search"],
        "w",
      ),
      T("sidebar-nav-gap", "size", [...ex, "g#1"], "h"),
      T("sidebar-nav-height", "size", [...ex, "Nav item"], "h"),
      T("sidebar-user-gap", "size", [...ex, "g#2"], "h"),
    ];
  })(),
  // Collapsed rail: the gaps between its groups (Figma spacer frames "g").
  ...(() => {
    const rail = ["Sidebar", "State=Collapsed"];
    return [
      T("rail-pad-y", "size", rail, "padY"),
      T("rail-group-gap", "size", [...rail, "g"], "h"),
      T("rail-search-gap", "size", [...rail, "g#1"], "h"),
      T("rail-footer-gap", "size", [...rail, "g#3"], "h"),
      T("rail-credits", "radius", [...rail, "Credits"], "radius"),
    ];
  })(),

  // Sidebar section header (245:28609): "Projects", "Today"… with a fold chevron and an action.
  T("section-header-height", "size", ["Sidebar section header"], "h"),
  T("section-header-pad-top", "size", ["Sidebar section header"], "padY"),
  T("section-header-pad-right", "size", ["Sidebar section header"], "padX"),
  T(
    "section-header-pad-bottom",
    "size",
    ["Sidebar section header"],
    "padBottom",
  ),
  T("section-header-gap", "size", ["Sidebar section header"], "gap"),
  T("section-header", "text", ["Sidebar section header", "Label"]),
  T(
    "section-header-chevron",
    "size",
    ["Sidebar section header", "Chevron"],
    "w",
  ),
  T("section-header-action", "size", ["Sidebar section header", "Add"], "w"),
  T(
    "section-header-action-icon",
    "size",
    ["Sidebar section header", "Add", "Icon/add"],
    "w",
  ),

  // Project row (245:28699)
  T("project-row-height", "size", ["Project row", "State=Default"], "h"),
  T("project-row-gap", "size", ["Project row", "State=Default"], "gap"),
  T("project-row", "radius", ["Project row", "State=Default"], "radius"),
  T("project-row-name", "text", ["Project row", "State=Default", "Name"]),
  T("project-row-name-active", "text", ["Project row", "State=Active", "Name"]),
  T("project-row-count", "text", ["Project row", "State=Default", "Count"]),

  // Chat row (245:28743)
  ...(() => {
    const row = ["Chat row", "State=Default, Models=Three"];
    return [
      T("chat-row-height", "size", row, "h"),
      T("chat-row-gap", "size", row, "gap"),
      T("chat-row-pad-left", "size", row, "padLeft"),
      T("chat-row-pad-right", "size", row, "padX"),
      T("chat-row", "radius", row, "radius"),
      T("chat-row-orbs", "size", [...row, "orbs"], "w"),
      T("chat-row-orb-overlap", "size", [...row, "orbs", "models"], "gap"),
      T("chat-row-title", "text", [...row, "Title"]),
      T("chat-row-title-active", "text", [
        "Chat row",
        "State=Active, Models=Three",
        "Title",
      ]),
      T("chat-row-cost", "text", [...row, "Cost"]),
    ];
  })(),

  // Menu item (245:28774) and Account menu (245:28819)
  T("menu-item-height", "size", ["Menu item", "Type=Default"], "h"),
  T("menu-item-pad", "size", ["Menu item", "Type=Default"], "padX"),
  T("menu-item-gap", "size", ["Menu item", "Type=Default"], "gap"),
  T("menu-item", "radius", ["Menu item", "Type=Default"], "radius"),
  T("menu-item-icon", "size", ["Menu item", "Type=Default", "Icon"], "w"),
  T(
    "menu-item-submenu-icon",
    "size",
    ["Menu item", "Type=Default", "Submenu"],
    "w",
  ),
  T("menu-item-label", "text", ["Menu item", "Type=Default", "Label"]),
  T("menu-item-trailing", "text", ["Menu item", "Type=Default", "Trailing"]),
  T("account-menu-width", "size", ["Account menu"], "w"),
  T("account-menu-pad", "size", ["Account menu"], "padX"),
  T("account-menu-gap", "size", ["Account menu"], "gap"),
  T("account-menu", "radius", ["Account menu"], "radius"),
  T("account-menu", "shadow", ["Account menu"]),

  // Credits (245:28812): State=Collapsed bar and State=Expanded card
  ...(() => {
    const c = ["Credits", "State=Collapsed"];
    const e = ["Credits", "State=Expanded"];
    return [
      T("credits-bar-height", "size", c, "h"),
      T("credits-bar-pad-left", "size", c, "padLeft"),
      T("credits-bar-pad-right", "size", c, "padX"),
      T("credits-gap", "size", c, "gap"),
      T("credits-icon", "size", [...c, "Icon/flash"], "w"),
      T("credits-balance", "text", [...c, "Balance"]),
      T("credits-top-up-link", "text", [...c, "actions", "Top up"]),
      T("credits-toggle", "size", [...c, "Toggle"], "w"),
      T("credits-toggle-icon", "size", [...c, "Toggle", "Icon/up"], "w"),
      T("credits-card", "radius", e, "radius"),
      T("credits-card-pad-top", "size", e, "padY"),
      T("credits-card-pad", "size", e, "padX"),
      T("credits-card-gap", "size", e, "gap"),
      T("credits-head-height", "size", [...e, "head"], "h"),
      T("credits-money", "text", [...e, "BDT"]),
      T("credits-progress-height", "size", [...e, "Progress"], "h"),
      T("credits-progress", "radius", [...e, "Progress"], "radius"),
      T("credits-top-up-height", "size", [...e, "actions", "Top up"], "h"),
      T("credits-top-up-pad", "size", [...e, "actions", "Top up"], "padX"),
      T("credits-top-up", "text", [...e, "actions", "Top up", "Label"]),
      T("credits-go-pro-gap", "size", [...e, "actions", "Go Pro"], "gap"),
      T("credits-go-pro", "text", [...e, "actions", "Go Pro", "Label"]),
    ];
  })(),
  T(
    "answer-card-receipt-gap-failed",
    "size",
    ["Answer card", "State=Failed", "Receipt row"],
    "gap",
  ),
  T(
    "composer-file-gap",
    "size",
    ["Composer", "State=Attachment", "Attachments", "File · Menu-draft.pdf"],
    "gap",
  ),
  T(
    "composer-wave-gap",
    "size",
    ["Composer", "State=Voice listening", "Toolbar", "Waveform"],
    "gap",
  ),
  T(
    "composer-wave-max",
    "size",
    ["Composer", "State=Voice listening", "Toolbar", "Waveform"],
    "h",
  ),
  T(
    "composer-file-pad-right",
    "size",
    ["Composer", "State=Attachment", "Attachments", "File · Menu-draft.pdf"],
    "padX",
  ),
  T(
    "composer-language-pad-x",
    "size",
    ["Composer", "State=Voice listening", "Toolbar", "Language"],
    "padX",
  ),
  T(
    "composer-menu-item-pad",
    "size",
    ["Composer menu", "Item/Add photos & files"],
    "padX",
  ),
  // ---- Organisms · group 2
  T("order-summary", "shadow", ["Order summary"]),
  T("order-summary-width", "size", ["Order summary"], "w"),
  T("overline", "text", ["Order summary", "ORDER SUMMARY"]),
  T("order-summary-total", "text", ["Order summary", "line", "BDT 699"]),
  T("order-summary-label", "text", ["Order summary", "line#1", "Credits"]),
  T("order-summary-label-strong", "text", ["Order summary", "line", "You pay"]),
  T("order-summary-value", "text", ["Order summary", "line#1", "69,900"]),
  T("order-summary-pay", "text", [
    "Order summary",
    "Pay (black pill)",
    "Pay BDT 699 with bKash",
  ]),
  T(
    "order-summary-trust-icon",
    "size",
    ["Order summary", "trust", "Icon/square-lock-02"],
    "w",
  ),

  T("settings-nav", "shadow", ["Settings nav"]),
  T("settings-nav-width", "size", ["Settings nav"], "w"),

  T("dialog", "shadow", ["Delete dialog"]),
  T("dialog-width", "size", ["Delete dialog"], "w"),
  T("dialog-icon", "radius", ["Delete dialog", "icon"], "radius"),
  T(
    "dialog-icon-glyph",
    "size",
    ["Delete dialog", "icon", "Icon/delete-02"],
    "w",
  ),
  T("dialog-title", "text", ["Delete dialog", "Delete your account?"]),
  T("dialog-body", "text", [
    "Delete dialog",
    "This can’t be undone. You will lose:",
  ]),
  T("dialog-list-label", "size", ["Delete dialog", "Loss list", "r", "c"], "w"),
  T("dialog-list", "text", [
    "Delete dialog",
    "Loss list",
    "r",
    "4 chats and their history",
  ]),
  T("dialog-list-strong", "text", [
    "Delete dialog",
    "Loss list",
    "r#1",
    "10,684 credits (≈ BDT 106.84)",
  ]),
  T(
    "dialog-link-icon",
    "size",
    ["Delete dialog", "Download first", "Icon/download-01"],
    "w",
  ),
  T("dialog-confirm-input", "text", [
    "Delete dialog",
    "Confirm field",
    "input",
    "DELETE",
  ]),
  T("dialog-cta", "text", [
    "Delete dialog",
    "actions",
    "Delete (red)",
    "Delete account",
  ]),

  T("stat-card", "shadow", ["Stat summary row", "Stat/BALANCE"]),
  T("stat-value", "text", [
    "Stat summary row",
    "Stat/BALANCE",
    "10,684 credits",
  ]),
  T("stat-caption", "text", [
    "Stat summary row",
    "Stat/BALANCE",
    "≈ BDT 106.84 · about 410 chats at your average",
  ]),
  T("stat-chip", "text", [
    "Stat summary row",
    "Stat/BALANCE",
    "chip",
    "Credits never expire",
  ]),
  // ---- Organisms · group 2b
  T("step-title", "text", ["Top-up table", "h", "1 Choose an amount"]),
  T("top-up-col-pay", "size", ["Top-up table", "Table head", "c"], "w"),
  T("top-up-col-get", "size", ["Top-up table", "Table head", "c#1"], "w"),
  T("top-up-col-bonus", "size", ["Top-up table", "Table head", "c#2"], "w"),
  T("top-up-col-chats", "size", ["Top-up table", "Table head", "c#3"], "w"),
  T("top-up-price", "text", ["Top-up table", "Pack BDT 99", "c", "BDT 99"]),
  T("top-up-custom-height", "size", ["Top-up table", "Custom amount"], "h"),

  T(
    "payment-method-radio",
    "size",
    ["Payment method selector", "methods", "Method bKash", "radio"],
    "w",
  ),
  T(
    "payment-method-radio-ring",
    "stroke",
    ["Payment method selector", "methods", "Method bKash", "radio"],
    "strokeWeight",
  ),
  T(
    "payment-method-radio-border",
    "stroke",
    ["Payment method selector", "methods", "Method Nagad", "radio"],
    "strokeWeight",
  ),
  T("payment-method-name", "text", [
    "Payment method selector",
    "methods",
    "Method bKash",
    "t",
    "bKash",
  ]),

  T("dialog-sm-width", "size", ["Checkout dialog"], "w"),
  T("dialog-hero-title", "text", [
    "Checkout dialog",
    "Approve in your bKash app",
  ]),
  T("dialog-hero-body", "text", [
    "Checkout dialog",
    "We sent a payment request. Open bKash, check the amount, and approve.",
  ]),
  T("dialog-summary-label", "text", [
    "Checkout dialog",
    "summary",
    "r",
    "Amount",
  ]),
  T("dialog-summary-value", "text", [
    "Checkout dialog",
    "summary",
    "r",
    "BDT 699",
  ]),

  T("usage-insight-width", "size", ["Usage card", "Insight"], "w"),
  T("usage-bar-height", "size", ["Usage card", "By model", "Stacked bar"], "h"),
  T("usage-orb", "size", ["Usage card", "By model", "row GPT-5", "orb"], "w"),
  T("usage-row-height", "size", ["Usage card", "By model", "row GPT-5"], "h"),
  T(
    "usage-col-credits",
    "size",
    ["Usage card", "By model", "row GPT-5", "c"],
    "w",
  ),
  T(
    "usage-col-money",
    "size",
    ["Usage card", "By model", "row GPT-5", "c#1"],
    "w",
  ),
  T(
    "usage-col-share",
    "size",
    ["Usage card", "By model", "row GPT-5", "c#2"],
    "w",
  ),
  T("usage-insight-title", "text", [
    "Usage card",
    "Insight",
    "Gemini cost about half as much as GPT-5 on the same prompt.",
  ]),
  T("usage-insight-body", "text", [
    "Usage card",
    "Insight",
    "If quality is close, picking Gemini for quick questions makes your credits last longer.",
  ]),

  T("table-row", "radius", ["Activity table", "row"], "radius"),
  T("table-row-height", "size", ["Activity table", "row"], "h"),
  T("table-subrow-height", "size", ["Activity table", "row#1"], "h"),
  T("activity-col-date", "size", ["Activity table", "head", "c"], "w"),
  T("activity-col-chat", "size", ["Activity table", "head", "c#1"], "w"),
  T("activity-col-models", "size", ["Activity table", "head", "c#2"], "w"),
  T("activity-col-credits", "size", ["Activity table", "head", "c#3"], "w"),
  T("activity-col-money", "size", ["Activity table", "head", "c#4"], "w"),
  T("table-number", "text", ["Activity table", "row", "c#3", "26 credits"]),
  T("payments-col-date", "size", ["Payments table", "head", "c"], "w"),
  T("payments-col-top-up", "size", ["Payments table", "head", "c#1"], "w"),
  T("payments-col-status", "size", ["Payments table", "head", "c#2"], "w"),
  T("payments-col-action", "size", ["Payments table", "head", "c#3"], "w"),
  // ---- Organisms · group 3a
  T("best-answer-text", "text", [
    "Best answer card",
    "Merged answer",
    "Here are the strongest name ideas from all three models:",
  ]),
  T("identity-initials", "text", [
    "Identity card",
    "avatar row",
    "Avatar",
    "AH",
  ]),
  T("data-tile", "radius", ["Data card", "Row/Chat history", "tile"], "radius"),
  // ---- Organisms · group 3b
  T("notif-col", "size", ["Notification matrix", "Head", "col"], "w"),
  T("group-label", "text", ["Notification matrix", "Group MONEY", "MONEY"]),
  T(
    "toggle-locked",
    "opacity",
    ["Notification matrix", "Row/Payment receipts", "top", "cell", "Toggle on"],
    "opacity",
  ),
  T("password", "text", [
    "Sign-in methods card",
    "Set password (expanded)",
    "Field/New password",
    "input",
    "••••••••••",
  ]),
  T(
    "set-password-indent",
    "size",
    ["Sign-in methods card", "Set password (expanded)"],
    "padLeft",
  ),
  // ---- Organisms · group 4
  T("picker-width", "size", ["Model picker modal"], "w"),
  T("picker-height", "size", ["Model picker modal"], "h"),
  T(
    "picker-col-model",
    "size",
    ["Model picker modal", "Model list (scrolls)", "Head", "c#1"],
    "w",
  ),
  T(
    "picker-col-version",
    "size",
    ["Model picker modal", "Model list (scrolls)", "Head", "c#2"],
    "w",
  ),
  T(
    "picker-col-tags",
    "size",
    ["Model picker modal", "Model list (scrolls)", "Head", "c#3"],
    "w",
  ),
  T(
    "picker-col-speed",
    "size",
    ["Model picker modal", "Model list (scrolls)", "Head", "c#4"],
    "w",
  ),
  T(
    "picker-col-cost",
    "size",
    ["Model picker modal", "Model list (scrolls)", "Head", "c#5"],
    "w",
  ),
  T(
    "picker-version-width",
    "size",
    [
      "Model picker modal",
      "Model list (scrolls)",
      "Row/GPT-5",
      "c#2",
      "Version",
    ],
    "w",
  ),
  T(
    "picker-version-height",
    "size",
    [
      "Model picker modal",
      "Model list (scrolls)",
      "Row/GPT-5",
      "c#2",
      "Version",
    ],
    "h",
  ),
  T(
    "picker-speed-bar-width",
    "size",
    ["Model picker modal", "Model list (scrolls)", "Row/GPT-5", "c#4", "bar"],
    "w",
  ),
  T(
    "picker-speed-bar-height",
    "size",
    ["Model picker modal", "Model list (scrolls)", "Row/GPT-5", "c#4", "bar"],
    "h",
  ),
  T(
    "picker-row-height",
    "size",
    ["Model picker modal", "Model list (scrolls)", "Row/GPT-5"],
    "h",
  ),
  ...[
    ["o3", "Row/o3"],
    ["perplexity", "Row/Perplexity"],
    ["llama", "Row/Llama"],
    ["qwen", "Row/Qwen"],
  ].map(([m, row]) =>
    T(
      `orb-${m}`,
      "gradient",
      ["Model picker modal", "Model list (scrolls)", row, "c#1", "Model orb"],
      "fill",
    ),
  ),

  T("hero-subtitle", "text", [
    "Home hero",
    "Ask once. Get the best answer from up to three models.",
  ]),
  T("starter-card", "shadow", [
    "Home hero",
    "Starters",
    "Card/Compare three models",
  ]),
  T("starter-card-text", "text", [
    "Home hero",
    "Starters",
    "Card/Compare three models",
    "t",
    "See GPT, Claude and Gemini by side",
  ]),
  T("hero-art-width", "size", ["Home hero", "Model constellation"], "w"),
  T("hero-art-height", "size", ["Home hero", "Model constellation"], "h"),
  T("composer-width", "size", ["Composer", "State=Default"], "w"),
  // ---- Screens: one file per area in scripts/screen-tokens/ (see the README there)
  ...screenTokens,
  // ---- Templates (drawn at 0.75 scale in Figma; values are divided by the scale)
  TL(
    "page-width",
    ["Template/Settings shell", "Slot/Page title + setting cards"],
    (t) =>
      t["Settings nav"].w +
      (t["Slot/Page title + setting cards"].x -
        t["Settings nav"].x -
        t["Settings nav"].w) +
      t["Slot/Page title + setting cards"].w,
  ),
  TL(
    "checkout-main-width",
    ["Template/Full page with checkout"],
    (t) => t["Slot/Choose amount + pay with"].w,
  ),
  TL(
    "app-main-top",
    ["Template/App shell"],
    (t) => t["Slot/Hero or answer thread"].y - t.Sidebar.y,
  ),
  TL(
    "page-top",
    ["Template/Settings shell"],
    (t) => t["Settings nav"].y - t["Page top bar"].y - t["Page top bar"].h,
  ),
  TL("shell-pad", ["Template/App shell"], (t) => t.Sidebar.x),
  TL(
    "shell-gap",
    ["Template/App shell"],
    (t) => t["Slot/Hero or answer thread"].x - t.Sidebar.x - t.Sidebar.w,
  ),
  TL(
    "settings-gap",
    ["Template/Settings shell"],
    (t) =>
      t["Slot/Page title + setting cards"].x -
      t["Settings nav"].x -
      t["Settings nav"].w,
  ),
  TL(
    "checkout-row-gap",
    ["Template/Full page with checkout"],
    (t) =>
      t["Slot/Choose amount + pay with"].y -
      t["Slot/Summary cards"].y -
      t["Slot/Summary cards"].h,
  ),
  TL(
    "checkout-col-gap",
    ["Template/Full page with checkout"],
    (t) =>
      t["Order summary"].x -
      t["Slot/Choose amount + pay with"].x -
      t["Slot/Choose amount + pay with"].w,
  ),
];

// ---------------------------------------------------------------------------
// Find a layer. "name#2" picks the third child with that name.

/** Screen snapshot node → the component-spec shape the resolver reads. */
function fromScreen(n) {
  const o = {
    w: n.w,
    h: n.h,
    pos: [n.x, n.y],
    radius: n.r,
    strokeWeight: n.sw,
    gap: n.al?.[5],
    pad: n.al ? n.al.slice(1, 5) : undefined,
    opacity: n.op ?? 1,
    blur: Number(/LAYER_BLUR:(\d+)/.exec(n.fx ?? "")?.[1]) || undefined,
    children: (n.k ?? []).map((c) => ({ ...fromScreen(c), name: c.n })),
  };
  if (n.ts?.startsWith("Luminous/")) o.textStyle = n.ts;
  const raw = /^raw (.+) (\S+) ([\d.]+)\/([\d.]+) ls(-?[\d.]+)$/.exec(
    n.ts ?? "",
  );
  if (raw) {
    o.font = { family: raw[1], style: raw[2] };
    o.fontSize = Number(raw[3]);
    o.lineHeight = { value: Number(raw[4]) };
    o.letterSpacing = { unit: "PIXELS", value: Number(raw[5]) };
  }
  return o;
}

function find(path, screen = false) {
  const [componentName, ...rest] = path;
  if (screen) {
    let node = screens[componentName];
    if (!node) throw new Error(`No Figma screen "${componentName}"`);
    const trail = [componentName];
    for (const step of rest) {
      const [name, index = "0"] = step.split("#");
      node = (node.k ?? []).filter((c) => c.n === name)[Number(index)];
      trail.push(step);
      if (!node) throw new Error(`No layer "${trail.join(" › ")}"`);
    }
    return { node: fromScreen(node), where: path.join(" › ") };
  }
  let node = components.find((c) => c.name === componentName);
  if (!node) throw new Error(`No Figma component "${componentName}"`);
  const trail = [componentName];
  for (const step of rest) {
    const [name, index = "0"] = step.split("#");
    const matches = (node.children ?? []).filter((c) => c.name === name);
    node = matches[Number(index)];
    trail.push(step);
    if (!node) throw new Error(`No layer "${trail.join(" › ")}"`);
  }
  return { node, where: path.join(" › ") };
}

// ---------------------------------------------------------------------------
// Existing Luminous tokens, to alias instead of duplicating.

function leaves(node, path = []) {
  return Object.entries(node).flatMap(([k, v]) =>
    k.startsWith("$")
      ? []
      : v && typeof v === "object" && "$type" in v
        ? [{ path: [...path, k], token: v }]
        : leaves(v, [...path, k]),
  );
}
const dimensionTokens = leaves(variables["luminous-dimension"]).map(
  ({ path, token }) => ({
    group: path[0],
    cssVar: `--${path.join("-")}`,
    value: token.$value,
  }),
);
const ALIAS_GROUPS = {
  size: ["size", "space"],
  radius: ["radius"],
  blur: ["blur"],
};
const aliasFor = (kind, value) =>
  (ALIAS_GROUPS[kind] ?? []).flatMap((g) =>
    dimensionTokens.filter((t) => t.group === g && t.value === value),
  )[0];

const WEIGHT = {
  Light: 300,
  Regular: 400,
  Medium: 500,
  SemiBold: 600,
  "Semi Bold": 600,
  Bold: 700,
};
const FAMILY = { Geist: "var(--font-sans)", "Geist Mono": "var(--font-mono)" };
const textKey = (family, style, size, lh, ls) =>
  `${family}|${WEIGHT[style]}|${size}|${lh}|${ls}`;
const luminousText = new Map(
  textStyles
    .filter((s) => s.name.startsWith("Luminous/"))
    .map((s) => [
      textKey(
        s.fontFamily,
        s.fontStyle,
        s.fontSize,
        s.lineHeight.value,
        Number(s.letterSpacing.value.toFixed(2)),
      ),
      `type-${s.name.slice(9).toLowerCase().replace(/\s+/g, "-")}`,
    ]),
);

// ---------------------------------------------------------------------------
// Value conversion

const round = (n, d = 2) => Number(n.toFixed(d));
const px = (n) => `${round(n)}px`;
const hex = (h) => (h.endsWith("ff") ? h.slice(0, 7) : h);

/** CSS linear-gradient for a square node from Figma's gradientTransform. */
function gradientCss(fill) {
  const [[a, b, c]] = fill.transform;
  const g = Math.hypot(a, b);
  const angle = (Math.atan2(a, -b) * 180) / Math.PI;
  const rad = (angle * Math.PI) / 180;
  const span = Math.abs(Math.sin(rad)) + Math.abs(Math.cos(rad));
  const position = (u) => ((u - c - (a + b) / 2) / (g * span) + 0.5) * 100;
  const stops = fill.stops.map(
    (s) =>
      `${s.var ? `var(--${s.var.replace("/", "-")})` : hex(s.color)} ${round(position(s.pos))}%`,
  );
  return `linear-gradient(${round(angle)}deg, ${stops.join(", ")})`;
}

const paint = (p) =>
  p.var ? `var(--${p.var.replace("/", "-")})` : hex(p.color);

// ---------------------------------------------------------------------------
// Resolve every token

const vars = []; // { name, value, where, note }
const theme = []; // Tailwind mapping lines
const utilities = [];
const emittedText = new Map(); // text spec → first utility that has it
const report = [];

for (const t of TOKENS) {
  if (t.template) {
    const raw = round(
      t.fn(templateSnapshot.templates[t.template]) / templateSnapshot.scale,
    );
    const alias = aliasFor("size", raw);
    const cssVar = `--${t.name}`;
    vars.push(
      `  ${cssVar}: ${alias ? `var(${alias.cssVar})` : px(raw)}; /* ${t.template} (÷ ${templateSnapshot.scale}) */`,
    );
    theme.push(`  --spacing-${t.name}: var(${cssVar});`);
    report.push({
      token: cssVar,
      where: t.template,
      figma: px(raw),
      result: alias
        ? `= ${alias.cssVar.slice(2).replace("-", "/")}`
        : "new size",
    });
    continue;
  }
  const { node, where } = find(t.path, t.screen);

  if (t.kind === "text") {
    // The layer has a Luminous text style in Figma: the component token is just that style.
    if (node.textStyle?.startsWith("Luminous/")) {
      const style = `type-${node.textStyle.slice(9).toLowerCase().replace(/\s+/g, "-")}`;
      report.push({
        token: `type-${t.name}`,
        where,
        figma: node.textStyle,
        result: `= ${style} (bound in Figma)`,
      });
      // Same name as the Luminous utility (e.g. type-badge): it already exists.
      if (style !== `type-${t.name}`)
        utilities.push(
          `/* ${where}: ${node.textStyle} */\n@utility type-${t.name} {\n  @apply ${style};\n}\n`,
        );
      continue;
    }
    const ls =
      node.letterSpacing.unit === "PERCENT"
        ? round((node.letterSpacing.value * node.fontSize) / 100)
        : round(node.letterSpacing.value);
    const same = luminousText.get(
      textKey(
        node.font.family,
        node.font.style,
        node.fontSize,
        node.lineHeight.value,
        ls,
      ),
    );
    const spec = `${node.font.family} ${node.font.style} ${node.fontSize}/${node.lineHeight.value} ls ${ls}`;
    const key = textKey(
      node.font.family,
      node.font.style,
      node.fontSize,
      node.lineHeight.value,
      ls,
    );
    const earlier = emittedText.get(key);
    if (!same && earlier) {
      report.push({
        token: `type-${t.name}`,
        where,
        figma: spec,
        result: `= ${earlier} (same component text style)`,
      });
      utilities.push(
        `/* ${where}: ${spec}, same as ${earlier} */\n@utility type-${t.name} {\n  @apply ${earlier};\n}\n`,
      );
      continue;
    }
    if (same) {
      report.push({
        token: `type-${t.name}`,
        where,
        figma: spec,
        result: `= ${same} (layer has no text style)`,
      });
      utilities.push(
        `/* ${where}: ${spec}, same as ${same} */\n@utility type-${t.name} {\n  @apply ${same};\n}\n`,
      );
      continue;
    }
    if (!FAMILY[node.font.family] || !WEIGHT[node.font.style])
      throw new Error(`${where}: unsupported font ${spec}`);
    report.push({
      token: `type-${t.name}`,
      where,
      figma: spec,
      result: "new text style",
    });
    emittedText.set(key, `type-${t.name}`);
    utilities.push(`/* ${where}: ${spec} */
@utility type-${t.name} {
  font-family: ${FAMILY[node.font.family]};
  font-size: ${px(node.fontSize)};
  line-height: ${px(node.lineHeight.value)};
  font-weight: ${WEIGHT[node.font.style]};
  letter-spacing: ${px(ls)};
}
`);
    continue;
  }

  let value;
  let cssVar = `--${t.name}`;
  if (t.kind === "shadow" && node.effectStyle) {
    // Linked to a Luminous effect style in Figma: alias it.
    const [group, variant] = node.effectStyle.toLowerCase().split("/");
    const key =
      group === "elevation"
        ? variant
        : variant === "default"
          ? group
          : `${group}-${variant}`;
    cssVar = `--${t.name}-shadow`;
    value = `var(--shadow-${key})`;
    report.push({
      token: cssVar,
      where,
      figma: node.effectStyle,
      result: `= ${node.effectStyle} (bound in Figma)`,
    });
    theme.push(`  --shadow-${t.name}: var(${cssVar});`);
  } else if (t.kind === "shadow") {
    const shadows = (node.effects ?? []).filter(
      (e) => e.type === "DROP_SHADOW",
    );
    if (!shadows.length) throw new Error(`${where}: no drop shadow`);
    cssVar = `--${t.name}-shadow`;
    value = shadows
      .map(
        (e) =>
          `${e.offset.x}px ${e.offset.y}px ${e.radius}px ${e.spread ?? 0}px ${e.color}`,
      )
      .join(", ");
    // Equal to a Luminous effect style (just not applied in Figma)? Alias it.
    const sameStyle = styles.effectStyles.find((st) => {
      const drops = st.effects.filter((e) => e.type === "DROP_SHADOW");
      return (
        drops.length === shadows.length &&
        drops.every((e, i) => {
          const o = shadows[i];
          const alpha = Math.round(e.color.a * 255)
            .toString(16)
            .padStart(2, "0");
          const rgb = [e.color.r, e.color.g, e.color.b]
            .map((c) =>
              Math.round(c * 255)
                .toString(16)
                .padStart(2, "0"),
            )
            .join("");
          return (
            e.offset.x === o.offset.x &&
            e.offset.y === o.offset.y &&
            e.radius === o.radius &&
            `#${rgb}${alpha}` === o.color
          );
        })
      );
    });
    if (sameStyle) {
      const [group, variant] = sameStyle.name.toLowerCase().split("/");
      const key =
        group === "elevation"
          ? variant
          : variant === "default"
            ? group
            : `${group}-${variant}`;
      value = `var(--shadow-${key})`;
    }
    report.push({
      token: cssVar,
      where,
      figma: shadows
        .map((e) => `${e.offset.y}/${e.radius} ${e.color}`)
        .join(", "),
      result: sameStyle
        ? `= ${sameStyle.name} (effect style not applied in Figma)`
        : "new shadow (no effect style)",
    });
    theme.push(`  --shadow-${t.name}: var(${cssVar});`);
  } else if (t.kind === "gradient") {
    const fill = node.fills?.[0];
    if (!fill?.type?.startsWith("GRADIENT_LINEAR"))
      throw new Error(`${where}: expected a linear gradient`);
    if (round(node.w) !== round(node.h))
      throw new Error(`${where}: gradient conversion assumes a square layer`);
    value = gradientCss(fill);
    cssVar = `--${t.name}-fill`;
    report.push({
      token: cssVar,
      where,
      figma: fill.stops.map((s) => s.var ?? hex(s.color)).join(" → "),
      result: "new gradient (raw colours)",
    });
  } else if (t.kind === "color") {
    const p = (t.prop === "stroke" ? node.strokes : node.fills)?.[0];
    if (!p) throw new Error(`${where}: no ${t.prop}`);
    cssVar = `--${t.name}-color`;
    value = paint(p);
    report.push({
      token: cssVar,
      where,
      figma: p.var ?? hex(p.color),
      result: p.var ? `= ${p.var}` : "new colour (raw)",
    });
    if (!p.var) theme.push(`  --color-${t.name}: var(${cssVar});`);
  } else if (t.kind === "opacity") {
    value = String(round(node.opacity ?? 1));
    report.push({ token: cssVar, where, figma: value, result: "new opacity" });
  } else {
    const raw = {
      w: node.w,
      h: node.h,
      x: node.pos?.[0],
      radius: node.radius,
      strokeWeight: node.strokeWeight,
      gap: node.gap,
      padX: node.pad?.[1],
      padLeft: node.pad?.[3],
      padY: node.pad?.[0],
      padBottom: node.pad?.[2],
      y: node.pos?.[1],
      blur: node.blur,
    }[t.prop];
    if (typeof raw !== "number")
      throw new Error(`${where}: no numeric ${t.prop}`);
    if (t.kind === "radius")
      cssVar = `--${t.name}-radius`.replace("-radius-radius", "-radius");
    if (t.kind === "stroke") cssVar = `--${t.name}-width`;
    const alias = aliasFor(t.kind, raw);
    value = alias ? `var(${alias.cssVar})` : px(raw);
    report.push({
      token: cssVar,
      where,
      figma: px(raw),
      result: alias
        ? `= ${alias.cssVar.slice(2).replace("-", "/")} (not bound in Figma)`
        : `new ${t.kind}`,
    });
    if (t.kind === "blur") cssVar = `--${t.name}-blur`;
    if (t.kind === "blur") theme.push(`  --blur-${t.name}: var(${cssVar});`);
    if (t.kind === "size") theme.push(`  --spacing-${t.name}: var(${cssVar});`);
    if (t.kind === "radius")
      theme.push(`  --radius-${t.name}: var(${cssVar});`);
  }
  vars.push(`  ${cssVar}: ${value}; /* ${where} */`);
}

// ---------------------------------------------------------------------------

const HEADER = `/*
 * GENERATED by scripts/generate-component-tokens.mjs — do not edit.
 * Component tokens: values Figma components use that Luminous does not provide.
 * Source: src/styles/figma/components.json (Figma file fCrR78u1aj0DQjzpaEhrIY, page 28:7490).
 * Designer list: src/styles/component-tokens.md
 */
`;

writeFileSync(
  join(stylesDir, "components.css"),
  [
    HEADER,
    `:root {\n${vars.join("\n")}\n}\n`,
    `@theme inline reference {\n${theme.join("\n")}\n}\n`,
    ...utilities,
  ].join("\n"),
);

const table = report
  .map((r) => `| \`${r.token}\` | ${r.where} | ${r.figma} | ${r.result} |`)
  .join("\n");
writeFileSync(
  join(stylesDir, "component-tokens.md"),
  `<!-- GENERATED by scripts/generate-component-tokens.mjs — do not edit. -->

# Component tokens for the designer

These values are used by Figma components but are not Luminous variables or text styles.
Code reads them from Figma automatically. To clean up, either add them to Luminous (variables /
text styles) or snap the component to an existing token, then re-export.

"= token (not bound in Figma)" means the value already equals a token: just bind the variable.

| Code token | Figma layer | Figma value | Status |
| --- | --- | --- | --- |
${table}
`,
);

console.log(
  `component tokens: ${vars.length} variables, ${utilities.length} text styles`,
);
