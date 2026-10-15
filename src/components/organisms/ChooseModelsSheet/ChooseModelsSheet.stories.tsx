import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ChooseModelsSheet } from "./ChooseModelsSheet";

const meta = {
  title: "Organisms/Choose models sheet",
  component: ChooseModelsSheet,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Not a Figma component yet: M25 · Choose AIs.",
      },
    },
  },
  args: {
    open: true,
    onOpenChange: () => {},
    title: "Choose up to 3 AIs",
    count: "3 of 3",
    description: "Each AI answers your question on its own.",
    options: [
      { id: "gpt", name: "GPT-5", description: "Good all-rounder · ~1 cr" },
      {
        id: "claude",
        name: "Claude",
        description: "Clear, careful writing · ~1.4 cr",
      },
      {
        id: "gemini",
        name: "Gemini",
        description: "Fastest, cheapest · ~0.3 cr",
      },
      { id: "deepseek", name: "DeepSeek", description: "Low cost · ~0.4 cr" },
      { id: "grok", name: "Grok", description: "Up-to-date news · ~0.8 cr" },
    ],
    selected: ["gpt", "claude", "gemini"],
    onToggle: () => {},
    limitNote: "To add another, untick one first.",
    applyLabel: "Use these 3",
  },
} satisfies Meta<typeof ChooseModelsSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Full: Story = {};
export const TwoSelected: Story = {
  args: {
    selected: ["gpt", "claude"],
    count: "2 of 3",
    applyLabel: "Use these 2",
  },
};
