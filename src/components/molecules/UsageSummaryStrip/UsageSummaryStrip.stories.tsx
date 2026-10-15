import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { UsageSummaryStrip } from "./UsageSummaryStrip";

const meta = {
  title: "Molecules/Usage summary strip",
  component: UsageSummaryStrip,
  parameters: {
    docs: {
      description: {
        component: "Figma: Prototype › Settings · Usage › Usage summary.",
      },
    },
  },
  args: {
    stats: [
      {
        label: "CREDITS SPENT",
        value: "26 credits",
        caption: "≈ BDT 0.26 this month",
      },
      { label: "PROMPTS", value: "1", caption: "in 1 chat" },
      {
        label: "AVERAGE PER PROMPT",
        value: "26 credits",
        caption: "Used for your “about N chats” estimate",
      },
      {
        label: "VS LAST MONTH",
        value: "New",
        caption: "Comparison starts next month",
      },
    ],
  },
  decorators: [
    (Story) => (
      <div style={{ width: 824 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof UsageSummaryStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
