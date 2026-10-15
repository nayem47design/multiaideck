import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SegmentedControl } from "./SegmentedControl";

const meta = {
  title: "Molecules/Segmented control",
  component: SegmentedControl,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Segmented control (28:8312).",
      },
    },
  },
  args: {
    label: "View",
    value: "best",
    options: [
      { value: "best", label: "Best answer" },
      { value: "compare", label: "Compare" },
    ],
  },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const First: Story = {};
export const Second: Story = { args: { value: "compare" } };
export const StateFocus: Story = {
  name: "State · Focus",
  parameters: { pseudo: { focusVisible: true } },
};
