// Generates component tokens: values that Figma components use but the Luminous variables
// and text styles do not provide (agreed: read them from Figma, never type them by hand).
//
//   src/styles/figma/components.json   component specs, exported from Figma (read-only)
//   src/styles/figma/luminous.*.json   the Luminous tokens, to alias equal values
//
// Output: src/styles/components.css (CSS variables, Tailwind mapping, text utilities) and
// src/styles/component-tokens.md (the list for the designer: every off-token value and where
// it comes from). Run `npm run tokens`.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const stylesDir = join(root, "src/styles");
const read = (f) => JSON.parse(readFileSync(join(stylesDir, f), "utf8"));
const { components } = read("figma/components.json");
const variables = read("figma/luminous.tokens.json");
const { textStyles } = read("figma/luminous.styles.json");

// ---------------------------------------------------------------------------
// Which values each component needs. Selectors name Figma layers; values come from Figma.
//   path: [component, variant?, ...child layer names]; prop: w | h | x | radius | strokeWeight | opacity
//   kind: size (Tailwind spacing), radius, stroke, opacity, text, gradient, color

const T = (name, kind, path, prop) => ({ name, kind, path, prop });

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

  T("tooltip-width", "size", ["Tooltip"], "w"),
  T("tooltip", "radius", ["Tooltip"], "radius"),
  T("tooltip-title", "text", ["Tooltip", "Title"]),
  T("tooltip-body", "text", ["Tooltip", "Body"]),

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
];

// ---------------------------------------------------------------------------
// Find a layer. "name#2" picks the third child with that name.

function find(path) {
  const [componentName, ...rest] = path;
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
const ALIAS_GROUPS = { size: ["size", "space"], radius: ["radius"] };
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
  const { node, where } = find(t.path);

  if (t.kind === "text") {
    if (node.textStyle)
      throw new Error(
        `${where} already has text style ${node.textStyle}; use it directly`,
      );
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
  if (t.kind === "shadow") {
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
    report.push({
      token: cssVar,
      where,
      figma: value,
      result: node.effectStyle
        ? `= ${node.effectStyle}`
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
