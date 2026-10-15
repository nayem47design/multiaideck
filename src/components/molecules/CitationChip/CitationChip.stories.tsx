import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CitationChip } from "./CitationChip";

const meta = {
  title: "Molecules/Citation chip",
  component: CitationChip,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Citation chip (103:20626).",
      },
    },
  },
  args: { children: "Onboarding study", href: "#" },
} satisfies Meta<typeof CitationChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const StateHover: Story = {
  name: "State · Hover",
  parameters: { pseudo: { hover: true } },
};
