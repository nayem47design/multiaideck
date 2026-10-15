// Wallet and payments: the Wallet screen, checkout overlays, Go Pro / Pro is on, and the mobile
// M10, M11, M12, M34–M38 screens. TS(name, kind, [screen, ...layer names], prop): see README.md.

const W = "Wallet";
const PRO = [W, "B · Order summary + Pro", "Pro comparison"];
const GO = "Overlay · Go Pro";
const ON = "Overlay · Pro is on";
const M10 = "M10 · Wallet";
const M11 = "M11 · Add credits: amount & bKash";
const M12 = "M12 · Payment received";
const M34 = "M34 · Finish payment in bKash";
const M36 = "M36 · Payment history";
const M37 = "M37 · Go Pro";

const screenTokens = (TS) => [
  // ---- Desktop Wallet
  TS("wallet-title", "text", [W, "Wallet"]),
  TS("wallet-lede", "text", [
    W,
    "Your balance, top-ups and payments. Spending detail is in Settings → Usage.",
  ]),
  TS("wallet-section", "text", [W, "Top up"]),
  TS("wallet-section-lede", "text", [
    W,
    "Pay in taka with bKash, Nagad or card. Bigger packs include bonus credits.",
  ]),
  TS("wallet-link", "text", [W, "Export", "Export CSV"]),
  TS("pro-compare-title", "text", [...PRO, "h", "Use AI every day? Try Pro"]),
  TS("pro-compare-head", "text", [
    ...PRO,
    "compare",
    "row",
    "c#1",
    "Pay as you go",
  ]),
  TS("pro-compare-cell", "text", [...PRO, "compare", "row#1", "c", "Price"]),
  TS("pro-compare-row-h", "size", [...PRO, "compare", "row"], "h"),
  TS("pro-compare-col-1", "size", [...PRO, "compare", "row", "c"], "w"),
  TS("pro-compare-col-2", "size", [...PRO, "compare", "row", "c#1"], "w"),
  TS("pro-compare-col-3", "size", [...PRO, "compare", "row", "c#2"], "w"),
  TS("pro-compare-table", "radius", [...PRO, "compare"], "radius"),
  TS("pro-compare-pill-h", "size", [...PRO, "Pill/See Pro details"], "h"),
  TS("usage-link", "radius", [W, "Usage link"], "radius"),

  // ---- Go Pro / Pro is on dialogs
  TS("go-pro-width", "size", [GO], "w"),
  TS("go-pro-pad", "size", [GO], "padX"),
  TS("go-pro-gap", "size", [GO], "gap"),
  TS("go-pro-crown", "size", [GO, "top", "t", "Icon/crown"], "w"),
  TS("go-pro-price", "text", [GO, "price", "৳1,599"]),
  TS(
    "go-pro-plan",
    "radius",
    [GO, "Compare plans", "Plan · Pay as you go"],
    "radius",
  ),
  TS("go-pro-plan-title", "text", [
    GO,
    "Compare plans",
    "Plan · Pay as you go",
    "Pay as you go",
  ]),
  TS("go-pro-button", "text", [GO, "Actions", "Button · Not now", "Not now"]),
  TS("go-pro-button-pad", "size", [GO, "Actions", "Button · Not now"], "padX"),
  TS("go-pro-actions-gap", "size", [GO, "Actions"], "gap"),
  TS("pro-on-icon", "size", [ON, "icon"], "w"),
  TS("pro-on-crown", "size", [ON, "icon", "Icon/crown"], "w"),
  TS("pro-on-title", "text", [ON, "You’re on Pro"]),

  // ---- Mobile
  TS("m-content-gap", "size", [M10, "Content"], "gap"),
  TS("m-card-gap", "size", [M10, "Content", "Balance"], "gap"),
  TS("m-balance-value", "text", [M10, "Content", "Balance", "10,684 credits"]),
  TS("m-chip", "text", [
    M10,
    "Content",
    "Balance",
    "Never expire",
    "Credits never expire",
  ]),
  TS("m-chip-h", "size", [M10, "Content", "Balance", "Never expire"], "h"),
  TS("m-chip-pad", "size", [M10, "Content", "Balance", "Never expire"], "padX"),
  TS(
    "m-chip-icon",
    "size",
    [M10, "Content", "Balance", "Never expire", "Icon/tick-02"],
    "w",
  ),
  TS("m-button", "text", [
    M10,
    "Content",
    "Balance",
    "Button · Add credits",
    "Add credits",
  ]),
  TS(
    "m-button-h",
    "size",
    [M10, "Content", "Balance", "Button · Add credits"],
    "h",
  ),
  TS(
    "m-button-lg-h",
    "size",
    [M11, "Pay bar", "Button · Pay ৳699 with bKash"],
    "h",
  ),
  TS("m-row-title", "text", [
    M10,
    "Content",
    "Row · Spent this month",
    "t",
    "Spent this month",
  ]),
  TS("m-row", "radius", [M10, "Content", "Row · Spent this month"], "radius"),
  TS("m-row-pad-x", "size", [M10, "Content", "Row · Spent this month"], "padX"),
  TS("m-row-pad-y", "size", [M10, "Content", "Row · Spent this month"], "padY"),
  TS("m-row-min-h", "size", [M10, "Content", "Row · Spent this month"], "h"),
  TS("m-tile", "size", [M10, "Content", "Row · Spent this month", "tile"], "w"),
  TS(
    "m-tile",
    "radius",
    [M10, "Content", "Row · Spent this month", "tile"],
    "radius",
  ),
  TS("m-hint-pad", "size", [M10, "Content", "How credits work"], "padX"),
  TS("m-step-title", "text", [M11, "Content", "1. How much?"]),
  TS("m-pack-h", "size", [M11, "Content", "Pack · ৳99"], "h"),
  TS("m-pack-pad", "size", [M11, "Content", "Pack · ৳99"], "padX"),
  TS("m-pack-price", "text", [M11, "Content", "Pack · ৳99", "৳99"]),
  TS("m-radio", "size", [M11, "Content", "Pack · ৳99", "radio"], "w"),
  TS("m-content-gap-sm", "size", [M11, "Content"], "gap"),
  TS("m-method-h", "size", [M11, "Content", "Methods", "Method · bKash"], "h"),
  TS("m-pay-bar-pad-y", "size", [M11, "Pay bar"], "padY"),
  TS("m-hero-icon", "size", [M12, "Success", "check"], "w"),
  TS("m-hero-icon-inner", "size", [M12, "Success", "check", "in"], "w"),
  TS(
    "m-hero-glyph",
    "size",
    [M12, "Success", "check", "in", "Icon/tick-02"],
    "w",
  ),
  TS("m-hero-title", "text", [M12, "Success", "Payment received"]),
  TS("m-hero-top", "size", [M12, "Success"], "y"),
  TS("m-receipt-pad", "size", [M12, "Receipt"], "padX"),
  TS("m-receipt-value", "text", [
    M12,
    "Receipt",
    "Line · In taka",
    "about ৳875.74",
  ]),
  TS("m-logo", "size", [M34, "Waiting", "bKash logo slot"], "w"),
  TS("m-step", "size", [M34, "Waiting", "Steps", "Step 1", "n"], "w"),
  TS("m-step-label", "text", [
    M34,
    "Waiting",
    "Steps",
    "Step 1",
    "Opened bKash",
  ]),
  TS("m-history-amount", "text", [
    M36,
    "List",
    "Payment · Today, 11:52 AM",
    "top",
    "৳699 via bKash",
  ]),
  TS(
    "m-history-status-h",
    "size",
    [M36, "List", "Payment · Today, 11:52 AM", "top", "status"],
    "h",
  ),
  TS("m-link", "text", [
    M36,
    "List",
    "Payment · Today, 11:52 AM",
    "action",
    "Download receipt",
  ]),
  TS("m-pro-price", "text", [M37, "Content", "Pro card", "price", "৳1,599"]),
];

export default screenTokens;
