import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ThinkingDots } from "./ThinkingDots";

const meta = {
  title: "Atoms/Thinking dots",
  component: ThinkingDots,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Thinking dots (103:20563).",
      },
    },
  },
  args: { label: "Thinking" },
} satisfies Meta<typeof ThinkingDots>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
