import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Checkbox } from "./Checkbox";

const meta = {
  title: "Atoms/Checkbox",
  component: Checkbox,
  parameters: {
    docs: {
      description: { component: "Figma: Design system › Checkbox (28:8251)." },
    },
  },
  args: { "aria-label": "Remember me" },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Checked: Story = { args: { defaultChecked: true } };
export const Unchecked: Story = { args: { defaultChecked: false } };
export const StateFocus: Story = {
  name: "State · Focus",
  parameters: { pseudo: { focusVisible: true } },
};
export const StateDisabled: Story = {
  name: "State · Disabled",
  args: { disabled: true },
};
