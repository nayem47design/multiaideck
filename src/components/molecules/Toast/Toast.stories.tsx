import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Toast } from "./Toast";

const meta = {
  title: "Molecules/Toast",
  component: Toast,
  parameters: {
    docs: {
      description: { component: "Figma: Design system › Toast (28:8409)." },
    },
  },
  args: {
    tone: "success",
    children: "76,890 credits added. New balance 87,574.",
  },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {};
export const Error: Story = {
  args: {
    tone: "error",
    children: "bKash payment didn’t go through. No money was taken.",
  },
};
