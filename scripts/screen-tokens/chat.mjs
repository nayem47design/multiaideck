// Screen tokens for the ask-and-compare flow: Home, /c/[id] (desktop chat screens and the
// mobile M-screens M2–M9, M18–M33). TS(name, kind, [screen, ...layer names], prop): see README.

const THINK = ["Thinking · Best answer", "Thinking card"];
const COMPARE_THINK = ["Thinking · Compare"];
const P2 = ["Compare · Prompt 2: 1 of 3 answered"];
const WHO = ["Compare · Writing prompt 3: who gets it?"];
const M20 = ["M20 · AIs are thinking", "Thinking"];

const screenTokens = (TS) => [
  // ---- Desktop: content column, Thinking card, Writing card, status bar
  TS("chat-column", "size", ["Best answer", "Best answer card"], "w"),
  TS("chat-thinking-pad", "size", THINK, "padX"),
  TS("chat-thinking-row", "size", [...THINK, "AI · GPT-5"], "h"),
  TS("chat-thinking-row", "radius", [...THINK, "AI · GPT-5"], "radius"),
  TS("chat-thinking-title", "text", [...THINK, "h", "t", "Asking 3 AIs…"]),
  TS("chat-thinking-model", "text", [...THINK, "AI · GPT-5", "GPT-5"]),
  TS("chat-stop-pad", "size", [...THINK, "Footer", "Button · Stop"], "padX"),
  TS("chat-writing-gap", "size", [...COMPARE_THINK, "Writing · GPT-5"], "gap"),
  TS(
    "chat-writing-header-gap",
    "size",
    [...COMPARE_THINK, "Writing · GPT-5", "Header"],
    "gap",
  ),
  TS("chat-writing-model", "text", [
    ...COMPARE_THINK,
    "Writing · GPT-5",
    "Header",
    "t",
    "GPT-5",
  ]),
  TS("chat-status-title", "text", [
    ...COMPARE_THINK,
    "Status bar",
    "Asking 3 AIs…",
  ]),
  TS("chat-status-stop", "text", [
    ...COMPARE_THINK,
    "Status bar",
    "Button · Stop",
    "Stop",
  ]),
  // Model constellation (three AI orbs): desktop card, M20, M2, M4.
  ...[
    ["sm", [...THINK, "h", "Model constellation"]],
    ["md", [...M20, "Model constellation"]],
    ["lg", ["M2 · Home", "Hero", "Model constellation"]],
    ["xl", ["M4 · Voice: listening", "Listening", "Model constellation"]],
  ].flatMap(([size, path]) => [
    TS(`chat-orbs-${size}-w`, "size", path, "w"),
    TS(`chat-orbs-${size}-small`, "size", [...path, "AI orb#0"], "w"),
    TS(`chat-orbs-${size}-big`, "size", [...path, "AI orb#2"], "w"),
  ]),
  // Answer cards fill the column down to the receipt: 494 (prompt 1), 438 (later prompts),
  // 388 (with the follow-up recipients bar).
  TS("chat-card-tall", "size", ["Compare", "Answer card"], "h"),
  TS("chat-card", "size", [...P2, "Answer card · GPT-5"], "h"),
  TS("chat-card-short", "size", [...WHO, "Answer card · GPT-5"], "h"),
  // Earlier prompt, collapsed; follow-up recipients bar.
  TS("chat-summary-height", "size", [...P2, "Prompt 1 (collapsed)"], "h"),
  TS("chat-summary", "radius", [...P2, "Prompt 1 (collapsed)"], "radius"),
  TS("chat-summary-pad-y", "size", [...P2, "Prompt 1 (collapsed)"], "padY"),
  TS(
    "chat-summary-chip",
    "size",
    [...P2, "Prompt 1 (collapsed)", "Result · Claude · 1.4 cr"],
    "h",
  ),
  TS(
    "chat-summary-chip-pad",
    "size",
    [...P2, "Prompt 1 (collapsed)", "Result · Claude · 1.4 cr"],
    "padX",
  ),
  TS("chat-recipients-pad-y", "size", [...WHO, "Follow-up recipients"], "padY"),

  // ---- Mobile: thinking (M20)
  TS("chat-m-thinking-gap", "size", M20, "gap"),
  TS("chat-m-thinking-row", "size", [...M20, "Progress", "AI · GPT-5"], "h"),
  TS(
    "chat-m-button",
    "size",
    ["M20 · AIs are thinking", "Stop", "Button · Stop"],
    "h",
  ),
  TS("chat-m-name", "text", [...M20, "Progress", "AI · GPT-5", "GPT-5"]),
  TS("chat-m-strong", "text", [
    "M5 · Best answer",
    "Answer head",
    "Best answer",
  ]),
  // Mobile composer (M2, M18, M19)
  TS("chat-m-composer-gap", "size", ["M2 · Home", "Mobile composer"], "gap"),
  TS("chat-m-composer-pad-x", "size", ["M2 · Home", "Mobile composer"], "padX"),
  TS(
    "chat-m-voice-note-h",
    "size",
    ["M18 · Voice: check your words", "Mobile composer", "From voice"],
    "h",
  ),
  TS(
    "chat-m-voice-note-pad",
    "size",
    ["M18 · Voice: check your words", "Mobile composer", "From voice"],
    "padX",
  ),
  TS("chat-m-voice-note", "text", [
    "M18 · Voice: check your words",
    "Mobile composer",
    "From voice",
    "From your voice. Check the words, then t",
  ]),
  TS(
    "chat-m-file",
    "radius",
    ["M19 · File attached", "Mobile composer", "File · Menu-draft.pdf"],
    "radius",
  ),
  TS(
    "chat-m-file-gap",
    "size",
    ["M19 · File attached", "Mobile composer", "File · Menu-draft.pdf"],
    "gap",
  ),
  // Mobile Compare (M6, M8)
  TS(
    "chat-m-tab-height",
    "size",
    ["M6 · Compare: one answer at a time", "Model tabs", "Tab · GPT-5"],
    "h",
  ),
  TS(
    "chat-m-tab-pad-x",
    "size",
    ["M6 · Compare: one answer at a time", "Model tabs", "Tab · GPT-5"],
    "padX",
  ),
  TS(
    "chat-m-selected",
    "stroke",
    ["M6 · Compare: one answer at a time", "Model tabs", "Tab · Claude"],
    "strokeWeight",
  ),
  TS(
    "chat-m-card-header-gap",
    "size",
    ["M6 · Compare: one answer at a time", "Answer card · Claude", "Header"],
    "gap",
  ),
  TS(
    "chat-m-card-pad-y",
    "size",
    ["M6 · Compare: one answer at a time", "Answer card · Claude", "Body"],
    "padY",
  ),
  TS(
    "chat-m-failed-gap",
    "size",
    ["M8 · Compare: an AI couldn’t answer", "Answer card · GPT-5 (failed)"],
    "gap",
  ),
  TS(
    "chat-m-refund-pad-y",
    "size",
    [
      "M8 · Compare: an AI couldn’t answer",
      "Answer card · GPT-5 (failed)",
      "Refund",
    ],
    "padY",
  ),
  TS("chat-m-bubble", "size", ["M5 · Best answer", "You"], "w"),
  // Sheets (M3, M7, M9, M25)
  TS(
    "chat-sheet-pad-bottom",
    "size",
    ["M3 · “+” sheet: add photos & files", "Add sheet"],
    "padY",
  ),
  TS(
    "chat-m-option-height",
    "size",
    [
      "M3 · “+” sheet: add photos & files",
      "Add sheet",
      "Option · Take a photo",
    ],
    "h",
  ),
  TS(
    "chat-m-option-gap",
    "size",
    [
      "M3 · “+” sheet: add photos & files",
      "Add sheet",
      "Option · Take a photo",
    ],
    "gap",
  ),
  TS(
    "chat-m-choice",
    "radius",
    [
      "M7 · How should we answer? (mode & AIs)",
      "Mode sheet",
      "Mode · Best answer",
    ],
    "radius",
  ),
  TS(
    "chat-m-choice-pad",
    "size",
    [
      "M7 · How should we answer? (mode & AIs)",
      "Mode sheet",
      "Mode · Best answer",
    ],
    "padX",
  ),
  TS(
    "chat-m-tag",
    "size",
    [
      "M7 · How should we answer? (mode & AIs)",
      "Mode sheet",
      "Mode · Best answer",
      "t",
      "tr",
      "tag",
    ],
    "h",
  ),
  TS(
    "chat-m-radio",
    "stroke",
    [
      "M7 · How should we answer? (mode & AIs)",
      "Mode sheet",
      "Mode · Compare",
      "radio",
    ],
    "strokeWeight",
  ),
  TS(
    "chat-m-pill-pad",
    "size",
    [
      "M7 · How should we answer? (mode & AIs)",
      "Mode sheet",
      "AIs used",
      "Presets",
      "Preset · Cheapest",
    ],
    "padX",
  ),
  TS(
    "chat-m-model-row",
    "size",
    ["M25 · Choose AIs", "Choose AIs sheet", "AI · GPT-5"],
    "h",
  ),
  TS(
    "chat-m-check",
    "radius",
    ["M25 · Choose AIs", "Choose AIs sheet", "AI · GPT-5", "check"],
    "radius",
  ),
  // Mobile Home (M2)
  TS(
    "chat-m-starter",
    "radius",
    ["M2 · Home", "Try one", "Starter · Write in Bangla"],
    "radius",
  ),
  TS(
    "chat-m-tile",
    "radius",
    ["M2 · Home", "Try one", "Starter · Write in Bangla", "tile"],
    "radius",
  ),
  TS(
    "chat-m-switch-pad",
    "size",
    ["M2 · Home", "Top row", "Language switch"],
    "padX",
  ),
  TS("chat-m-greeting", "text", ["M2 · Home", "Hero", "Good evening, Imam"]),
  // Voice (M4)
  TS(
    "chat-voice-done",
    "size",
    ["M4 · Voice: listening", "Controls", "Done", "Tap · tick"],
    "w",
  ),
  TS(
    "chat-voice-done-icon",
    "size",
    ["M4 · Voice: listening", "Controls", "Done", "Tap · tick", "Icon/tick-02"],
    "w",
  ),
  TS(
    "chat-voice-icon",
    "size",
    [
      "M4 · Voice: listening",
      "Controls",
      "Cancel",
      "Tap · cancel",
      "Icon/cancel-01",
    ],
    "w",
  ),
  TS(
    "chat-voice-bar",
    "size",
    ["M4 · Voice: listening", "Listening", "Waveform", "Rectangle"],
    "w",
  ),
  TS("chat-m-voice-title", "text", [
    "M4 · Voice: listening",
    "Listening",
    "Listening…",
  ]),
  TS("chat-m-transcript", "text", [
    "M4 · Voice: listening",
    "Listening",
    "Transcript",
    "Give me coffee shop names that feel loca",
  ]),
];

export default screenTokens;
