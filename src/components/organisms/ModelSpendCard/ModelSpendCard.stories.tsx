import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ModelSpendCard } from "./ModelSpendCard";

const meta = {
  title: "Organisms/Model spend card",
  component: ModelSpendCard,
  parameters: {
    docs: {
      description: { component: "Figma: Prototype › M13 · Usage › By AI." },
    },
  },
  args: {
    title: "Which AIs used your credits",
    rows: [
      {
        model: "gpt",
        name: "GPT-5",
        credits: "11 credits",
        share: 42,
        shareLabel: "42%",
      },
      {
        model: "claude",
        name: "Claude",
        credits: "10 credits",
        share: 38,
        shareLabel: "38%",
      },
      {
        model: "gemini",
        name: "Gemini",
        credits: "5 credits",
        share: 19,
        shareLabel: "19%",
      },
    ],
  },
  decorators: [
    (Story) => (
      <div style={{ width: 328 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ModelSpendCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
