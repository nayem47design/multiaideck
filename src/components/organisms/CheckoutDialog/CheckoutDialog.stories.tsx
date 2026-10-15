import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CheckoutDialogPanel } from "./CheckoutDialog";

const meta = {
  title: "Organisms/Checkout dialog",
  component: CheckoutDialogPanel,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Checkout dialog (103:21288).",
      },
    },
  },
  args: {
    head: "Secure checkout · PayStation (simulated)",
    title: "Approve in your bKash app",
    body: "We sent a payment request. Open bKash, check the amount, and approve.",
    summary: [
      { label: "Amount", value: "BDT 699" },
      { label: "You get", value: "76,890 credits" },
      { label: "Method", value: "bKash", text: true },
    ],
    approvedLabel: "I approved it",
    simulateFailureLabel: "Simulate a failed payment",
    cancelLabel: "Cancel",
  },
} satisfies Meta<typeof CheckoutDialogPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
