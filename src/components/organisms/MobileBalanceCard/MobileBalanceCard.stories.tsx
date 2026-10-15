import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MobileBalanceCard } from "./MobileBalanceCard";

const meta = {
  title: "Organisms/Mobile balance card",
  component: MobileBalanceCard,
  parameters: {
    docs: {
      description: { component: "Figma: Prototype › M10 · Wallet › Balance." },
    },
  },
  args: {
    label: "Your balance",
    value: "10,684 credits",
    caption: "About ৳106.84 · enough for about 410 questions",
    chip: "Credits never expire",
    action: { label: "Add credits" },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 328 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MobileBalanceCard>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const NoChip: Story = { args: { chip: undefined } };
