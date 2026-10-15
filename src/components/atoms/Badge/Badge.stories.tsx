import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Badge } from "./Badge";

const meta = {
  title: "Atoms/Badge",
  component: Badge,
  parameters: {
    docs: {
      description: { component: "Figma: Design system › Badge (28:8237)." },
    },
  },
  args: { tone: "neutral", children: "Neutral" },
  argTypes: {
    tone: {
      control: "inline-radio",
      options: ["neutral", "info", "success", "warning", "error"],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};
export const Info: Story = { args: { tone: "info", children: "Info" } };
export const Success: Story = {
  args: { tone: "success", children: "Success" },
};
export const Warning: Story = {
  args: { tone: "warning", children: "Warning" },
};
export const Error: Story = { args: { tone: "error", children: "Error" } };
