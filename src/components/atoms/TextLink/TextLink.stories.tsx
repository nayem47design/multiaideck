import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TextLink } from "./TextLink";

const meta = {
  title: "Atoms/Text link",
  component: TextLink,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Text link (103:20556).",
      },
    },
  },
  args: { children: "Compare with Pro", href: "#", external: true },
} satisfies Meta<typeof TextLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Muted: Story = { args: { variant: "muted" } };
export const StateHover: Story = {
  name: "State · Hover",
  parameters: { pseudo: { hover: true } },
};
export const StateFocus: Story = {
  name: "State · Focus",
  parameters: { pseudo: { focusVisible: true } },
};
