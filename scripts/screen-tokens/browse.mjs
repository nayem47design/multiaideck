// Screen tokens for the browse and auth screens: Sign in, Enter code, Chats, Search chats,
// Image studio, Presets (desktop) and M1, M14, M16, M17, M21, M22 (mobile).
// TS(name, kind, [screen, ...layer names], prop): see scripts/screen-tokens/README.md.

const SIGN_IN = "Desktop · Sign in";
const CODE = "Desktop · Enter code";
const M1 = "M1 · Welcome & language";
const M16 = "M16 · Sign in: phone number";
const M17 = "M17 · Enter the code";
const HERO = "One question.\nThree AIs.\nThe best answer";
const CHATS = "Chats";
const M14 = "M14 · Chats";
const SEARCH = "Overlay · Search chats";
const STUDIO = "Image studio";
const READY = "Image studio · Picture ready";
const M21 = "M21 · Make a picture";
const M22 = "M22 · Picture ready";
const PRESETS = "Presets";

const browse = (TS) => [
  // ---- Sign in (desktop: promise column + card; mobile: M1, M16, M17)
  TS("auth-pad", "size", [SIGN_IN, "Promise"], "x"),
  TS("auth-promise-w", "size", [SIGN_IN, "Promise"], "w"),
  TS(
    "auth-promise-body-w",
    "size",
    [SIGN_IN, "Promise", "Ask in English or Bangla. MultiAIDeck as"],
    "w",
  ),
  TS("auth-point-gap", "size", [SIGN_IN, "Promise", "Point"], "gap"),
  TS("auth-or-gap", "size", [SIGN_IN, "Sign in card", "or"], "gap"),
  TS("auth-hero", "text", [SIGN_IN, "Promise", HERO]),
  TS("auth-hero-mobile", "text", [M1, "Content", HERO]),
  TS("auth-card-w", "size", [SIGN_IN, "Sign in card"], "w"),
  TS("auth-card-pad", "size", [SIGN_IN, "Sign in card"], "padX"),
  TS("auth-card-title", "text", [
    SIGN_IN,
    "Sign in card",
    "Sign in or create an account",
  ]),
  TS("auth-mobile-title", "text", [M16, "Content", "Sign in with your phone"]),
  TS("auth-phone-h", "size", [SIGN_IN, "Sign in card", "Phone field"], "h"),
  TS(
    "auth-phone",
    "radius",
    [SIGN_IN, "Sign in card", "Phone field"],
    "radius",
  ),
  TS("auth-phone-gap", "size", [SIGN_IN, "Sign in card", "Phone field"], "gap"),
  TS("auth-phone-pad-mobile", "size", [M16, "Content", "Phone field"], "padX"),
  TS(
    "auth-country-pad",
    "size",
    [SIGN_IN, "Sign in card", "Phone field", "Country"],
    "padX",
  ),
  TS("auth-phone-h-mobile", "size", [M16, "Content", "Phone field"], "h"),
  TS("auth-phone-mobile", "radius", [M16, "Content", "Phone field"], "radius"),
  TS(
    "auth-country-h",
    "size",
    [SIGN_IN, "Sign in card", "Phone field", "Country"],
    "h",
  ),
  TS(
    "auth-country",
    "radius",
    [SIGN_IN, "Sign in card", "Phone field", "Country"],
    "radius",
  ),
  TS(
    "auth-country-h-mobile",
    "size",
    [M16, "Content", "Phone field", "Country"],
    "h",
  ),
  TS(
    "auth-country-mobile",
    "radius",
    [M16, "Content", "Phone field", "Country"],
    "radius",
  ),
  TS("auth-country", "text", [
    SIGN_IN,
    "Sign in card",
    "Phone field",
    "Country",
    "+880",
  ]),
  TS("auth-country-mobile", "text", [
    M16,
    "Content",
    "Phone field",
    "Country",
    "+880",
  ]),
  TS("auth-phone", "text", [
    SIGN_IN,
    "Sign in card",
    "Phone field",
    "1712 345 214",
  ]),
  TS("auth-phone-mobile", "text", [
    M16,
    "Content",
    "Phone field",
    "1712 345 214",
  ]),
  TS(
    "auth-button-h",
    "size",
    [SIGN_IN, "Sign in card", "Button · Send code"],
    "h",
  ),
  TS("auth-button", "text", [
    SIGN_IN,
    "Sign in card",
    "Button · Send code",
    "Send code",
  ]),
  TS(
    "auth-button-h-mobile",
    "size",
    [M16, "Bottom", "Button · Send code"],
    "h",
  ),
  TS(
    "auth-google-h-mobile",
    "size",
    [M16, "Bottom", "Button · Continue with Google"],
    "h",
  ),
  TS("auth-button-mobile", "text", [
    M16,
    "Bottom",
    "Button · Send code",
    "Send code",
  ]),
  TS("auth-link-mobile", "text", [M17, "Wrong number? Change it"]),
  TS("code-box-h", "size", [CODE, "Code card", "Code boxes", "Digit 1"], "h"),
  TS(
    "code-box-h-mobile",
    "size",
    [M17, "Content", "Code boxes", "Digit 1"],
    "h",
  ),
  TS("code-digit", "text", [CODE, "Code card", "Code boxes", "Digit 1", "4"]),
  TS("code-digit-mobile", "text", [
    M17,
    "Content",
    "Code boxes",
    "Digit 1",
    "4",
  ]),
  TS("language-gap", "size", [M1, "Bottom", "Language"], "gap"),
  TS(
    "language-option-h",
    "size",
    [M1, "Bottom", "Language", "Option · English"],
    "h",
  ),
  TS(
    "language-option",
    "radius",
    [M1, "Bottom", "Language", "Option · English"],
    "radius",
  ),
  TS(
    "language-option-pad",
    "size",
    [M1, "Bottom", "Language", "Option · English"],
    "padX",
  ),
  TS("language-option", "text", [
    M1,
    "Bottom",
    "Language",
    "Option · English",
    "English",
  ]),
  TS(
    "language-check",
    "size",
    [M1, "Bottom", "Language", "Option · English", "check"],
    "w",
  ),

  // ---- Browse pages (Chats, Image studio, Presets): the centred main column
  TS("browse-main-w", "size", [CHATS, "Main"], "w"),
  TS("browse-top", "size", [CHATS, "Main"], "y"),
  TS("browse-search-h", "size", [CHATS, "Main", "Search"], "h"),
  TS("choice-pill-h", "size", [CHATS, "Main", "Filters", "Filter · All"], "h"),
  TS(
    "choice-pill-pad",
    "size",
    [CHATS, "Main", "Filters", "Filter · All"],
    "padX",
  ),
  TS("choice-pill", "text", [CHATS, "Main", "Filters", "Filter · All", "All"]),
  TS(
    "choice-pill-h-lg",
    "size",
    [M21, "Picture sheet", "Styles", "Style · Photo"],
    "h",
  ),
  TS("choice-pill-lg", "text", [
    M21,
    "Picture sheet",
    "Styles",
    "Style · Photo",
    "Photo",
  ]),
  TS("chats-list-pad", "size", [CHATS, "Main", "List"], "padX"),
  TS("chats-group", "text", [CHATS, "Main", "List", "Group · Today", "Today"]),
  TS(
    "chats-row-h",
    "size",
    [CHATS, "Main", "List", "Chat · Coffee shop names"],
    "h",
  ),
  TS("chats-row-title", "text", [
    CHATS,
    "Main",
    "List",
    "Chat · Coffee shop names",
    "Coffee shop names",
  ]),
  TS(
    "chats-row-gap",
    "size",
    [CHATS, "Main", "List", "Chat · Coffee shop names"],
    "gap",
  ),
  TS(
    "chats-row-time-w",
    "size",
    [CHATS, "Main", "List", "Chat · Coffee shop names", "11:40"],
    "w",
  ),
  TS(
    "chats-row-orbs-w",
    "size",
    [CHATS, "Main", "List", "Chat · Coffee shop names", "orbs"],
    "w",
  ),
  TS(
    "chats-row-h-mobile",
    "size",
    [M14, "List", "Chat · Coffee shop names"],
    "h",
  ),
  TS(
    "chats-row-mobile",
    "radius",
    [M14, "List", "Chat · Coffee shop names"],
    "radius",
  ),
  TS("chats-row-title-mobile", "text", [
    M14,
    "List",
    "Chat · Coffee shop names",
    "t",
    "Coffee shop names",
  ]),
  TS(
    "chats-row-orbs-w-mobile",
    "size",
    [M14, "List", "Chat · Coffee shop names", "orbs"],
    "w",
  ),

  // ---- Search chats overlay
  TS("search-overlay-w", "size", [SEARCH], "w"),
  TS("search-query-h", "size", [SEARCH, "Query"], "h"),
  TS("search-query-pad", "size", [SEARCH, "Query"], "padX"),
  TS("search-query-gap", "size", [SEARCH, "Query"], "gap"),
  TS("search-query", "radius", [SEARCH, "Query"], "radius"),
  TS("search-query", "text", [SEARCH, "Query", "coffee"]),
  TS("search-result-h", "size", [SEARCH, "Result · Coffee shop names"], "h"),

  // ---- Image studio
  TS("browse-gap", "size", [STUDIO, "Main"], "gap"),
  TS("images-prompt", "text", [
    STUDIO,
    "Main",
    "Prompt box",
    "A cosy coffee shop sign that says “Golpo",
  ]),
  TS(
    "images-tile",
    "radius",
    [STUDIO, "Main", "Recent", "Picture 1"],
    "radius",
  ),
  TS(
    "images-picture-w",
    "size",
    [READY, "Main", "Body", "Picture (generated image placeholder)"],
    "w",
  ),
  TS(
    "images-picture-pad",
    "size",
    [READY, "Main", "Body", "Picture (generated image placeholder)"],
    "padLeft",
  ),
  TS("images-picture-caption", "text", [
    READY,
    "Main",
    "Body",
    "Picture (generated image placeholder)",
    "Golpo Coffee",
  ]),
  TS("images-picture-caption-mobile", "text", [M22, "Golpo Coffee"]),
  TS("images-side-w", "size", [READY, "Main", "Body", "Side"], "w"),
  TS("images-title", "text", [READY, "Main", "Head", "Golpo Coffee sign"]),
  TS("images-ready", "text", [
    READY,
    "Main",
    "Body",
    "Side",
    "Your picture is ready",
  ]),
  TS(
    "page-button-h",
    "size",
    [READY, "Main", "Body", "Side", "Button · Download"],
    "h",
  ),
  TS("images-sheet-gap", "size", [M21, "Picture sheet"], "gap"),
  TS("images-describe", "radius", [M21, "Picture sheet", "Describe"], "radius"),
  TS("images-action-gap", "size", [M22, "Actions"], "gap"),
  TS("images-describe-h", "size", [M21, "Picture sheet", "Describe"], "h"),
  TS("images-describe-pad", "size", [M21, "Picture sheet", "Describe"], "padX"),
  TS(
    "images-action-h-mobile",
    "size",
    [M22, "Actions", "row", "Button · Save to phone"],
    "h",
  ),

  // ---- Presets
  TS(
    "preset-card-pad",
    "size",
    [PRESETS, "Main", "Grid", "Preset · Recommended"],
    "padX",
  ),
  TS(
    "preset-card-gap",
    "size",
    [PRESETS, "Main", "Grid", "Preset · Recommended"],
    "gap",
  ),
  TS("preset-title", "text", [
    PRESETS,
    "Main",
    "Grid",
    "Preset · Recommended",
    "Recommended",
  ]),
  TS(
    "preset-tag-pad",
    "size",
    [PRESETS, "Main", "Grid", "Preset · Recommended", "top", "tag"],
    "padX",
  ),
  TS(
    "preset-action-pad",
    "size",
    [
      PRESETS,
      "Main",
      "Grid",
      "Preset · Recommended",
      "actions",
      "Button · Use",
    ],
    "padX",
  ),
  TS("preset-tag", "text", [
    PRESETS,
    "Main",
    "Grid",
    "Preset · Recommended",
    "top",
    "tag",
    "In use",
  ]),
  TS("preset-action", "text", [
    PRESETS,
    "Main",
    "Grid",
    "Preset · Recommended",
    "actions",
    "Button · Use",
    "Use",
  ]),
];

export default browse;
