import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ReceiptStrip } from "./ReceiptStrip";

const meta = {
  title: "Molecules/Receipt strip",
  component: ReceiptStrip,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Receipt strip (28:8373).",
      },
    },
  },
  args: {
    metrics: ["2.6 s", "142 tokens", "1.4 cr"],
    badge: { tone: "info", label: "Suggested" },
  },
} satisfies Meta<typeof ReceiptStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
