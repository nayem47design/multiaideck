import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ChatTitlePill } from "./ChatTitlePill";

const meta = {
  title: "Molecules/Chat title pill",
  component: ChatTitlePill,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Chat title pill (103:29055).",
      },
    },
  },
  args: { children: "Coffee shop names" },
} satisfies Meta<typeof ChatTitlePill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const StateFocus: Story = {
  name: "State · Focus",
  parameters: { pseudo: { focusVisible: true } },
};
