import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import type { PaymentMethod } from "@/components/atoms/PaymentLogoSlot";

import { MethodTiles } from "./MethodTiles";

const meta = {
  title: "Organisms/Method tiles",
  component: MethodTiles,
  parameters: {
    docs: {
      description: {
        component:
          "Figma: Prototype › M11 · Add credits: amount & bKash › Methods.",
      },
    },
  },
  args: {
    label: "2. Pay with",
    value: "bkash",
    onValueChange: () => {},
    methods: [
      { value: "bkash", name: "bKash" },
      { value: "nagad", name: "Nagad" },
      { value: "card", name: "Card" },
    ],
  },
  decorators: [
    (Story) => (
      <div style={{ width: 328 }}>
        <Story />
      </div>
    ),
  ],
  render: function Render(args) {
    const [value, setValue] = useState<PaymentMethod>(args.value);
    return <MethodTiles {...args} value={value} onValueChange={setValue} />;
  },
} satisfies Meta<typeof MethodTiles>;

export default meta;
export const Default: StoryObj<typeof meta> = {};
