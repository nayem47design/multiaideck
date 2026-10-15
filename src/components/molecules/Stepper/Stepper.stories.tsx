import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { Stepper } from "./Stepper";

const meta = {
  title: "Molecules/Stepper",
  component: Stepper,
  parameters: {
    docs: {
      description: { component: "Figma: Design system › Stepper (28:8344)." },
    },
  },
  args: {
    value: 500,
    onValueChange: () => {},
    step: 100,
    min: 100,
    valueLabel: "500 credits",
    decreaseLabel: "Fewer credits",
    increaseLabel: "More credits",
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <Stepper
        {...args}
        value={value}
        onValueChange={setValue}
        valueLabel={`${value} credits`}
      />
    );
  },
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const StateAtMinimum: Story = {
  name: "State · At minimum",
  args: { value: 100 },
};
