import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PaymentHistoryCard } from "./PaymentHistoryCard";

const meta = {
  title: "Molecules/Payment history card",
  component: PaymentHistoryCard,
  parameters: {
    docs: {
      description: {
        component: "Figma: Prototype › M36 · Payment history › Payment · …",
      },
    },
  },
  args: {
    amount: "৳699 via bKash",
    status: { label: "Added", tone: "success" },
    date: "Today, 11:52 AM",
    action: { icon: "arrow-down-01", label: "Download receipt" },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 328 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PaymentHistoryCard>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Added: Story = {};
export const NotCharged: Story = {
  args: {
    amount: "৳2,499 via bKash",
    status: { label: "Not charged", tone: "error" },
    date: "Oct 14, 12:38 PM",
    action: { icon: "reload", label: "Try again" },
  },
};
