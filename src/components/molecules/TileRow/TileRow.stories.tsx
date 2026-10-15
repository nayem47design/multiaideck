import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TileRow } from "./TileRow";

const meta = {
  title: "Molecules/Tile row",
  component: TileRow,
  parameters: {
    docs: {
      description: { component: "Figma: Prototype › M10 · Wallet › Row · …" },
    },
  },
  args: {
    icon: "chart-histogram",
    title: "Spent this month",
    caption: "26 credits (৳0.26)",
    link: <a href="#" />,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 328 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TileRow>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Link: Story = {};
export const TwoLines: Story = {
  args: {
    icon: "clock-01",
    title: "Payment history",
    caption: "Last: ৳2,499 via bKash · not charged",
  },
};
export const WithAction: Story = {
  args: {
    icon: "crown",
    title: "Pay as you go",
    caption: "Pro: ৳1,599 a month",
    link: undefined,
    action: { label: "Upgrade Now" },
  },
};
