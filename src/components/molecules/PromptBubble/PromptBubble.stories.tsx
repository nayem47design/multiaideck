import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PromptBubble } from "./PromptBubble";

const meta = {
  title: "Molecules/Prompt bubble",
  component: PromptBubble,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Prompt bubble (103:29047).",
      },
    },
  },
  args: { children: "Give me 3 name ideas for a small coffee shop in Dhaka" },
} satisfies Meta<typeof PromptBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
