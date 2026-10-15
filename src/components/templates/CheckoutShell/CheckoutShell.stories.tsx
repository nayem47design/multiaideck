import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { orderSummary, Slot, topBar } from "../templates.fixtures";
import { CheckoutShell } from "./CheckoutShell";

const meta = {
  title: "Templates/Full page with checkout",
  component: CheckoutShell,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Figma: Design system › Template/Full page with checkout (28:9384).",
      },
    },
  },
  args: {
    topBar,
    summary: <Slot label="SLOT · Summary cards" className="h-[180px]" />,
    children: (
      <Slot label="SLOT · Choose amount + pay with" className="h-[560px]" />
    ),
    orderSummary,
  },
} satisfies Meta<typeof CheckoutShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
