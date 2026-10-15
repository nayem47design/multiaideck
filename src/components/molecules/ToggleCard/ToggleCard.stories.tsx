import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ToggleCard } from "./ToggleCard";

const meta = {
  title: "Molecules/Toggle card",
  component: ToggleCard,
  parameters: {
    docs: {
      description: {
        component: "Figma: Prototype › M40 · Notifications › Toggle · *.",
      },
    },
  },
  args: {
    title: "Low balance",
    help: "When you have less than 500 credits left",
    checked: true,
    onCheckedChange: () => {},
  },
  decorators: [
    (Story) => (
      <div style={{ width: 328 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ToggleCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const On: Story = {};
export const Off: Story = {
  args: {
    title: "Offers and news",
    help: "New AIs and discounts",
    checked: false,
  },
};
export const Locked: Story = {
  args: {
    title: "Payments and receipts",
    help: "When credits are added or a payment fails",
    lockedLabel: "Always on",
  },
};
