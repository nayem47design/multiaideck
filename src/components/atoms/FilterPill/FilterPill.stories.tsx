import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FilterPill } from "./FilterPill";

const meta = {
  title: "Atoms/Filter pill",
  component: FilterPill,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Filter pill (28:8219).",
      },
    },
  },
  args: { children: "Writing", selected: false },
} satisfies Meta<typeof FilterPill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Selected: Story = { args: { selected: true } };
export const StateHover: Story = {
  name: "State · Hover",
  parameters: { pseudo: { hover: true } },
};
export const StateFocus: Story = {
  name: "State · Focus",
  parameters: { pseudo: { focusVisible: true } },
};
export const StateDisabled: Story = {
  name: "State · Disabled",
  args: { disabled: true },
};
