import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PaymentMethodSelector } from "./PaymentMethodSelector";

const meta = {
  title: "Organisms/Payment method selector",
  component: PaymentMethodSelector,
  parameters: {
    docs: {
      description: {
        component:
          "Figma: Design system › Payment method selector (103:20901).",
      },
    },
  },
  args: {
    title: "2   Pay with",
    methods: [
      { value: "bkash", name: "bKash", description: "Mobile wallet" },
      { value: "nagad", name: "Nagad", description: "Mobile wallet" },
      { value: "card", name: "Card", description: "Visa, Mastercard" },
    ],
    value: "bkash",
    onValueChange: () => {},
  },
} satisfies Meta<typeof PaymentMethodSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
