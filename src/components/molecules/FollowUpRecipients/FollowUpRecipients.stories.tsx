import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FollowUpRecipients } from "./FollowUpRecipients";

const meta = {
  title: "Molecules/Follow-up recipients",
  component: FollowUpRecipients,
  parameters: {
    docs: {
      description: {
        component:
          "Not a Figma component yet: “Follow-up recipients” on Compare · Writing prompt 3: who gets it?",
      },
    },
  },
  args: {
    message: "Not every AI answered last time. Send to:",
    options: [
      { value: "all", label: "All 3", note: "get your earlier prompts only" },
      { value: "claude", label: "Only Claude" },
    ],
    value: "all",
    onValueChange: () => {},
    cost: "Catch-up ≈ 0.5 cr",
  },
  decorators: [
    (Story) => (
      <div style={{ width: 880 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FollowUpRecipients>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllSelected: Story = {};
export const OnlyClaude: Story = { args: { value: "claude" } };
