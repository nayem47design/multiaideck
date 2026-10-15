import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PaymentLogoSlot } from "./PaymentLogoSlot";

const meta = {
  title: "Atoms/Payment logo slot",
  component: PaymentLogoSlot,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Payment logo slot (103:20611).",
      },
    },
  },
  args: { method: "bkash", label: "bKash" },
} satisfies Meta<typeof PaymentLogoSlot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Bkash: Story = {};
export const Nagad: Story = { args: { method: "nagad", label: "Nagad" } };
export const Card: Story = { args: { method: "card", label: "Card" } };
