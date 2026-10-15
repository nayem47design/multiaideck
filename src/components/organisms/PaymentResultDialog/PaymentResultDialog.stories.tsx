import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PaymentResultDialogPanel } from "./PaymentResultDialog";

const meta = {
  title: "Organisms/Payment result dialog",
  component: PaymentResultDialogPanel,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Payment result dialog (103:21324).",
      },
    },
  },
  args: {
    result: "received",
    title: "Payment received",
    body: "76,890 credits were added to your wallet.",
    summary: [
      { label: "Paid", value: "BDT 699 · bKash", text: true },
      { label: "Added", value: "76,890 credits" },
      { label: "New balance", value: "87,574 credits" },
    ],
    primaryLabel: "Back to chat",
    secondaryLabel: "View receipt",
  },
} satisfies Meta<typeof PaymentResultDialogPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Received: Story = {};
export const Failed: Story = {
  args: {
    result: "failed",
    title: "Payment didn’t go through",
    body: "No money was taken from your bKash account. You can try again or choose another method.",
    primaryLabel: "Try again",
    secondaryLabel: "Choose another method",
  },
};
