import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CreditsPill } from "./CreditsPill";

const meta = {
  title: "Molecules/Credits pill",
  component: CreditsPill,
  parameters: {
    docs: {
      description: {
        component: "Not a Figma component yet: “Credits pill” on M2 · Home.",
      },
    },
  },
  args: {
    credits: "10,684 credits",
    money: "৳106",
    link: <a href="#wallet" />,
  },
} satisfies Meta<typeof CreditsPill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
