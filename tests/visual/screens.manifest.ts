import type { Page } from "@playwright/test";

// Every Figma Prototype frame (tests/visual/figma/screens/<slug>__<theme>__<width>.png) and how to
// reach the same screen in the app. Desktop frames are exported at 1x and compared at 1440×900
// (tall frames full page); mobile frames are exported at 2x and compared on a 360-wide phone.
// Overlay frames are just the dialog, so the dialog element is compared.
//
// `todo` keeps a frame visible in the report without failing the run, with the reason.

export interface ScreenCase {
  /** App URL (English; the locale prefix is added for /bn runs). */
  url: string;
  /** Prepare the state the frame shows (open a menu, an overlay…). */
  setup?: (page: Page) => Promise<void>;
  /** Compare one element (dialogs) instead of the viewport. */
  element?: string;
  /** Capture the whole page (frames taller than the viewport). */
  fullPage?: boolean;
  /** localStorage entries set before the page loads (device preferences). */
  storage?: Record<string, string>;
  /** Why this frame can't be compared yet. */
  todo?: string;
}

const key = (combo: string) => async (page: Page) => {
  await page.keyboard.press(combo);
};
const click = (name: string | RegExp) => async (page: Page) => {
  await page
    .getByRole("button", { name })
    .filter({ visible: true })
    .first()
    .click();
};
const DIALOG = "[role=dialog]";

const CHAT = "/c/coffee-shop-names";

export const SCREENS: Record<string, ScreenCase> = {
  // ---- Sign in
  "desktop-sign-in": { url: "/sign-in?step=phone" },
  "desktop-enter-code": { url: "/sign-in/code" },
  "m1-welcome-language": { url: "/sign-in" },
  "m16-sign-in-phone-number": { url: "/sign-in?step=phone" },
  "m17-enter-the-code": { url: "/sign-in/code" },

  // ---- Home
  home: { url: "/" },
  "home-menu": { url: "/?composer=menu" },
  "home-voice-listening": { url: "/?composer=voice" },
  "home-voice-text-ready": { url: "/?composer=voice-ready" },
  "home-files-attached": { url: "/?composer=files" },
  "home-sidebar-collapsed": {
    url: "/",
    storage: { "multiai-sidebar": "collapsed" },
    // The frame shows the New chat tooltip, as on hover.
    setup: async (page) => {
      await page
        .getByRole("link", { name: "New chat" })
        .filter({ visible: true })
        .hover();
      await page.getByRole("tooltip").waitFor();
    },
  },
  "m2-home": { url: "/" },
  "m3-sheet-add-photos-files": { url: "/?composer=menu" },
  "m4-voice-listening": { url: "/?composer=voice" },
  "m18-voice-check-your-words": { url: "/?composer=voice-ready" },
  "m19-file-attached": { url: "/?composer=files" },
  "m7-how-should-we-answer-mode-ais": { url: "/?sheet=mode" },
  "m25-choose-ais": { url: "/?sheet=models" },
  "overlay-model-picker": { url: "/?sheet=models", element: DIALOG },

  // ---- A chat (the seeded coffee-shop chat; states per the Phase 6 chat page)
  "thinking-best-answer": { url: `${CHAT}?state=thinking-best&hold=1` },
  "best-answer": { url: `${CHAT}?state=best` },
  "best-answer-menu": { url: `${CHAT}?state=best&composer=menu` },
  "best-answer-voice-listening": { url: `${CHAT}?state=best&composer=voice` },
  "best-answer-voice-text-ready": {
    url: `${CHAT}?state=best&composer=voice-ready`,
  },
  "best-answer-files-attached": { url: `${CHAT}?state=best&composer=files` },
  "thinking-compare": { url: `${CHAT}?state=thinking-compare&hold=1` },
  compare: { url: `${CHAT}?state=compare` },
  "compare-menu": { url: `${CHAT}?state=compare&composer=menu` },
  "compare-voice-listening": { url: `${CHAT}?state=compare&composer=voice` },
  "compare-voice-text-ready": {
    url: `${CHAT}?state=compare&composer=voice-ready`,
  },
  "compare-files-attached": { url: `${CHAT}?state=compare&composer=files` },
  "thinking-prompt-2-2-ais-slow": { url: `${CHAT}?state=thinking-2&hold=1` },
  "compare-prompt-2-1-of-3-answered": { url: `${CHAT}?state=prompt-2` },
  "compare-prompt-2-gpt-5-answered-on-retry": {
    url: `${CHAT}?state=prompt-2-retry`,
  },
  "compare-writing-prompt-3-who-gets-it": { url: `${CHAT}?state=prompt-3-who` },
  "thinking-prompt-3-catching-up": { url: `${CHAT}?state=thinking-3&hold=1` },
  "compare-prompt-3-all-3-answered": { url: `${CHAT}?state=prompt-3` },
  "m5-best-answer": { url: `${CHAT}?state=best` },
  "m6-compare-one-answer-at-a-time": { url: `${CHAT}?state=compare` },
  "m23-compare-gpt-5-answer": { url: `${CHAT}?state=compare&tab=gpt` },
  "m24-compare-gemini-answer": { url: `${CHAT}?state=compare&tab=gemini` },
  "m8-compare-an-ai-couldn-t-answer": { url: `${CHAT}?state=prompt-2&tab=gpt` },
  "m9-follow-up-who-should-get-it": { url: `${CHAT}?state=prompt-3-who` },
  "m20-ais-are-thinking": { url: `${CHAT}?state=thinking-best&hold=1` },
  "m26-follow-up-thinking-2-ais-slow": {
    url: `${CHAT}?state=thinking-2&hold=1`,
  },
  "m27-follow-up-claude-s-answer": { url: `${CHAT}?state=prompt-2&tab=claude` },
  "m28-follow-up-gemini-unavailable": {
    url: `${CHAT}?state=prompt-2&tab=gemini`,
  },
  "m29-follow-up-gpt-5-answered-on-retry": {
    url: `${CHAT}?state=prompt-2-retry&tab=gpt`,
  },
  "m30-prompt-3-thinking-catching-up": {
    url: `${CHAT}?state=thinking-3&hold=1`,
  },
  "m31-prompt-3-claude": { url: `${CHAT}?state=prompt-3&tab=claude` },
  "m32-prompt-3-gpt-5": { url: `${CHAT}?state=prompt-3&tab=gpt` },
  "m33-prompt-3-gemini": { url: `${CHAT}?state=prompt-3&tab=gemini` },

  // ---- Chats, search, images, presets
  chats: { url: "/chats" },
  "m14-chats": { url: "/chats" },
  "overlay-search-chats": {
    url: "/chats",
    setup: async (page) => {
      await key("ControlOrMeta+k")(page);
      await page.getByRole("dialog").getByRole("combobox").fill("coffee");
    },
    element: DIALOG,
  },
  "image-studio": { url: "/images" },
  "image-studio-picture-ready": { url: "/images?picture=golpo-coffee-sign" },
  "m21-make-a-picture": { url: "/images" },
  "m22-picture-ready": { url: "/images?picture=golpo-coffee-sign" },
  presets: { url: "/presets" },

  // ---- Wallet and payments
  wallet: { url: "/wallet", fullPage: true },
  "m10-wallet": { url: "/wallet" },
  "m11-add-credits-amount-bkash": { url: "/wallet/top-up" },
  "overlay-checkout-simulated": { url: "/wallet/pay", element: DIALOG },
  "overlay-payment-received": { url: "/wallet/paid", element: DIALOG },
  "overlay-payment-failed": { url: "/wallet/failed", element: DIALOG },
  "m34-finish-payment-in-bkash": { url: "/wallet/pay" },
  "m12-payment-received": { url: "/wallet/paid" },
  "m35-payment-didn-t-go-through": { url: "/wallet/failed" },
  "m36-payment-history": { url: "/wallet/payments" },
  "overlay-go-pro": {
    url: "/wallet",
    setup: click("Upgrade Now"),
    element: DIALOG,
  },
  "overlay-pro-is-on": {
    url: "/wallet",
    setup: async (page) => {
      await click("Upgrade Now")(page);
      await click(/Upgrade with bKash/)(page);
    },
    element: DIALOG,
  },
  "m37-go-pro": { url: "/wallet", setup: click("Upgrade Now") },
  "m38-pro-is-on": {
    url: "/wallet",
    setup: async (page) => {
      await click("Upgrade Now")(page);
      await click(/Upgrade with bKash/)(page);
    },
  },

  // ---- Settings and account
  "settings-profile": { url: "/settings/profile" },
  "settings-notifications": { url: "/settings/notifications" },
  "settings-privacy-security": { url: "/settings/privacy", fullPage: true },
  "settings-usage": { url: "/settings/usage", fullPage: true },
  "settings-help-support": { url: "/settings/help" },
  "overlay-delete-account": {
    url: "/settings/profile",
    setup: click("Delete account"),
    element: DIALOG,
  },
  "overlay-sign-out": {
    url: "/",
    setup: click("Account menu"),
    element: DIALOG,
  },
  "m13-usage": { url: "/settings/usage" },
  "m15-account-settings": { url: "/settings" },
  "m39-language": { url: "/settings", setup: click(/^Language/) },
  "m40-notifications": { url: "/settings/notifications" },
  "m41-privacy-security": { url: "/settings/privacy" },
  "m42-help-support": { url: "/settings/help" },
  "m43-sign-out": { url: "/settings", setup: click("Sign out") },
};
