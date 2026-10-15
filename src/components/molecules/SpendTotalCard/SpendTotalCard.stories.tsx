import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SpendTotalCard } from "./SpendTotalCard";

const meta = {
  title: "Molecules/Spend total card",
  component: SpendTotalCard,
  parameters: {
    docs: {
      description: { component: "Figma: Prototype › M13 · Usage › Total." },
    },
  },
  args: {
    label: "You spent",
    value: "26 credits",
    secondary: "about ৳0.26",
    caption: "1 question this month · 0 refunds",
  },
  decorators: [
    (Story) => (
      <div style={{ width: 328 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SpendTotalCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
