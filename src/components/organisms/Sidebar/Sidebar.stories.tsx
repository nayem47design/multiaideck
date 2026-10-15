import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Sidebar } from "./Sidebar";

// Figma's Sidebar frames are 876px tall: 268px wide expanded, 66px collapsed (the rail).
function Frame(
  Story: () => React.JSX.Element,
  { args }: { args: { collapsed?: boolean | "auto" } },
) {
  return (
    <div style={{ width: args.collapsed === true ? 66 : 268, height: 876 }}>
      <Story />
    </div>
  );
}

const chat = (
  id: string,
  title: string,
  meta: string,
  models: ("gpt" | "claude" | "gemini")[],
  active = false,
) => ({
  id,
  title,
  meta,
  models,
  active,
  link: <a href="#" />,
});

const meta = {
  title: "Organisms/Sidebar",
  component: Sidebar,
  parameters: {
    docs: {
      description: {
        component:
          "Figma: Design system › Sidebar (227:32985): State=Expanded and State=Collapsed.",
      },
    },
  },
  args: {
    brand: "MultiAI",
    collapseLabel: "Collapse sidebar",
    newChat: { label: "New chat", shortcut: "⌘N", link: <a href="#" /> },
    search: { placeholder: "Search chats", shortcut: "⌘K" },
    nav: [
      { icon: "bubble-chat", label: "Chats", link: <a href="#" /> },
      { icon: "image-01", label: "Image studio", link: <a href="#" /> },
      { icon: "bookmark-02", label: "Presets", link: <a href="#" /> },
    ],
    sections: [
      {
        label: "Today",
        chats: [
          chat(
            "1",
            "Coffee shop names",
            "3 models · 2.6 cr",
            ["gpt", "claude", "gemini"],
            true,
          ),
          chat("2", "Hellow", "3 models · 0.9 cr", ["gpt", "claude", "gemini"]),
          chat("3", "Who are you?", "3 models · 14 cr", [
            "gpt",
            "claude",
            "gemini",
          ]),
          chat("4", "How old are you", "Best answer · 4 cr", ["claude"]),
        ],
      },
    ],
    credits: {
      amount: "10,684 credits",
      money: "≈ BDT 106.84",
      progress: 60,
      progressLabel: "Credits left",
      topUp: { label: "Top up" },
      goPro: { label: "Go Pro", link: <a href="#" /> },
    },
    user: {
      name: "Al Imam Hossain",
      email: "alhossain@musemind.agency",
      initials: "AH",
      menuLabel: "Account menu",
    },
  },
  decorators: [Frame],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Figma: Sidebar State=Collapsed (227:32794), the 66px rail. Hover an icon for its label. */
export const Collapsed: Story = {
  args: {
    collapsed: true,
    expandLabel: "Expand sidebar",
    toggleShortcut: "⌘\\",
  },
};
