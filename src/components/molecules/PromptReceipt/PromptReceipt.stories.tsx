import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PromptReceipt } from "./PromptReceipt";

const meta = {
  title: "Molecules/Prompt receipt",
  component: PromptReceipt,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Prompt receipt (103:29070).",
      },
    },
  },
  args: {
    summary: "This prompt: 3 models · 2.6 credits · ≈ BDT 0.03",
    detail: "Cheapest: Gemini (0.3 cr)",
  },
} satisfies Meta<typeof PromptReceipt>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
