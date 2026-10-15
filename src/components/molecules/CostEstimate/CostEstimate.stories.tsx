import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CostEstimate } from "./CostEstimate";

const meta = {
  title: "Molecules/Cost estimate",
  component: CostEstimate,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Cost estimate (103:25116).",
      },
    },
  },
  args: { children: "≈ 2 to 4 cr" },
} satisfies Meta<typeof CostEstimate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
