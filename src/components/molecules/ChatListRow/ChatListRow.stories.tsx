import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Icon } from "@/components/atoms/Icon";

import { ChatListRow, chatRowMoreButton } from "./ChatListRow";

const meta = {
  title: "Molecules/Chat list row",
  component: ChatListRow,
  parameters: {
    docs: {
      description: {
        component:
          "Figma: Prototype › Chats › List › Chat · Coffee shop names; M14 · Chats below 768px (use the mobile viewport).",
      },
    },
  },
  args: {
    title: "Coffee shop names",
    meta: "Compare · 3 prompts · 6.9 cr",
    mobileMeta: "Compare · 3 AIs · 6.9 credits",
    time: "11:40",
    models: ["gpt", "claude", "gemini"],
    link: <a href="#" />,
    more: (
      <button type="button" aria-label="More" className={chatRowMoreButton}>
        <Icon name="more-horizontal" className="size-icon-button-icon" />
      </button>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 842, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatListRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const OneModel: Story = {
  args: {
    title: "How old are you",
    meta: "Best answer · 4 cr",
    mobileMeta: "Best answer · 4 credits",
    time: "Tue",
    models: ["gemini"],
  },
};
export const Pinned: Story = { args: { pinnedLabel: "Pinned" } };
export const Renaming: Story = {
  args: {
    editor: (
      <input
        aria-label="Chat name"
        defaultValue="Coffee shop names"
        className="min-w-0 flex-1 rounded-xs bg-surface px-2 type-chats-row-title text-ink ring-1 ring-blue"
      />
    ),
  },
};
export const Mobile: Story = {
  globals: { viewport: { value: "mobile1" } },
};
export const Dark: Story = { globals: { theme: "dark" } };
