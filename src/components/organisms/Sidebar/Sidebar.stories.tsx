import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

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
  cost: string,
  models: ("gpt" | "claude" | "gemini")[],
  active = false,
) => ({ id, title, cost, models, active, link: <a href="#" /> });

const project = (id: string, name: string, count: string) => ({
  id,
  name,
  count,
  link: <a href="#" />,
});

const meta = {
  title: "Organisms/Sidebar",
  component: Sidebar,
  parameters: {
    docs: {
      description: {
        component:
          "Figma: Design system › Sidebar (227:32985): State=Expanded and State=Collapsed. Section headers fold their rows, Credits folds with its chevron, the account row opens the Account menu.",
      },
    },
  },
  args: {
    brand: "MultiAI",
    collapseLabel: "Collapse sidebar",
    newChat: { label: "New chat", shortcut: "⌘N", link: <a href="#" /> },
    search: { label: "Search chats", shortcut: "⌘K" },
    nav: [
      { icon: "bubble-chat", label: "Chats", link: <a href="#" /> },
      { icon: "image-01", label: "Image studio", link: <a href="#" /> },
      { icon: "bookmark-02", label: "Presets", link: <a href="#" /> },
    ],
    projects: {
      label: "Projects",
      add: { label: "New project" },
      items: [
        project("p1", "MultiAI launch", "12"),
        project("p2", "Coffee brand", "5"),
        project("p3", "Thesis research", "8"),
      ],
      rail: { link: <a href="#" /> },
    },
    sections: [
      {
        id: "today",
        label: "Today",
        chats: [
          chat(
            "1",
            "Coffee shop names",
            "2.6 cr",
            ["gpt", "claude", "gemini"],
            true,
          ),
          chat("2", "Hellow", "0.9 cr", ["gpt", "claude", "gemini"]),
          chat("3", "Who are you?", "14 cr", ["gpt", "claude", "gemini"]),
          chat("4", "How old are you", "Best · 4 cr", ["gemini"]),
        ],
      },
    ],
    credits: {
      expandLabel: "Show credits",
      collapseLabel: "Hide credits",
      balance: "10,684 credits",
      money: "≈ BDT 106.84",
      progress: 52.7,
      progressLabel: "Credits left",
      topUp: { label: "Top up" },
      goPro: { label: "Go Pro", link: <a href="#" /> },
    },
    user: {
      name: "Al Imam Hossain",
      email: "alhossain@musemind.agency",
      initials: "AH",
      menuLabel: "Account menu",
      menu: [
        {
          id: "settings",
          icon: "settings-01",
          label: "Settings",
          trailing: "⌘,",
          link: <a href="#" />,
        },
        {
          id: "usage",
          icon: "chart-histogram",
          label: "Usage & billing",
          link: <a href="#" />,
        },
        {
          id: "language",
          icon: "globe-02",
          label: "Language",
          trailing: "English",
          submenu: true,
          link: <a href="#" />,
        },
        {
          id: "help",
          icon: "help-circle",
          label: "Help & support",
          link: <a href="#" />,
        },
        {
          id: "sign-out",
          icon: "logout-03",
          label: "Sign out",
          tone: "danger",
          separatorBefore: true,
        },
      ],
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

/** Fold and unfold sections and Credits; open the Account menu from the account row. */
export const Interactive: Story = {
  render: function Render(args) {
    const [folded, setFolded] = useState<string[]>([]);
    const [open, setOpen] = useState(false);
    return (
      <Sidebar
        {...args}
        folded={folded}
        onFoldToggle={(id) =>
          setFolded((f) =>
            f.includes(id) ? f.filter((x) => x !== id) : [...f, id],
          )
        }
        credits={{
          ...args.credits,
          state: open ? "expanded" : "collapsed",
          onToggle: () => setOpen((o) => !o),
        }}
      />
    );
  },
};
