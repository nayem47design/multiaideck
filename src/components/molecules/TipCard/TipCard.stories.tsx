import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TipCard } from "./TipCard";

const meta = {
  title: "Molecules/Tip card",
  component: TipCard,
  parameters: {
    docs: {
      description: {
        component: "Figma: Prototype › M13 · Usage › Tip; M41 › Your data.",
      },
    },
  },
  args: {
    icon: "idea-01",
    title: "Save credits",
    children:
      "Gemini cost about half as much as GPT-5. For quick questions, choose the “Cheapest” option.",
  },
  decorators: [
    (Story) => (
      <div style={{ width: 328 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TipCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Privacy: Story = {
  args: {
    icon: "shield-01",
    title: "Your chats are private",
    children:
      "We send your question to the AIs you choose, and nothing else. We don’t sell your data.",
  },
};
