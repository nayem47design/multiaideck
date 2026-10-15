import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MetricChip } from "./MetricChip";

const meta = {
  title: "Atoms/Metric chip",
  component: MetricChip,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Metric chip (28:8285).",
      },
    },
  },
  args: { children: "1.4 cr" },
} satisfies Meta<typeof MetricChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
