import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { PeriodSelect } from "./PeriodSelect";

const meta = {
  title: "Molecules/Period select",
  component: PeriodSelect,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Figma: Prototype › Settings · Usage › Period (below 768px: M13 · Usage › Top bar › Period).",
      },
    },
  },
  args: {
    label: "Period",
    value: "this",
    onValueChange: () => {},
    options: [
      { value: "this", label: "This month" },
      { value: "last", label: "Last month" },
    ],
  },
} satisfies Meta<typeof PeriodSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Interactive: Story = {
  render: function Render(args) {
    const [value, setValue] = useState("this");
    return <PeriodSelect {...args} value={value} onValueChange={setValue} />;
  },
};
