import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Toggle } from "./Toggle";

const meta = {
  title: "Atoms/Toggle",
  component: Toggle,
  parameters: {
    docs: {
      description: { component: "Figma: Design system › Toggle (28:8244)." },
    },
  },
  args: { "aria-label": "Notifications" },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const On: Story = { args: { defaultChecked: true } };
export const Off: Story = { args: { defaultChecked: false } };
export const StateFocus: Story = {
  name: "State · Focus",
  args: { defaultChecked: true },
  parameters: { pseudo: { focusVisible: true } },
};
export const StateDisabled: Story = {
  name: "State · Disabled",
  args: { disabled: true },
};
