import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { WritingCard } from "./WritingCard";

const meta = {
  title: "Organisms/Writing card",
  component: WritingCard,
  parameters: {
    docs: {
      description: {
        component:
          "Not a Figma component yet: “Writing · <model>” on Thinking · Compare and the Prompt 2 / 3 thinking screens.",
      },
    },
  },
  args: {
    model: "gpt",
    modelName: "GPT-5",
    provider: "OpenAI",
    status: "Writing…",
  },
} satisfies Meta<typeof WritingCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Writing: Story = {};
export const TakingLonger: Story = {
  args: { status: "Taking longer than usual…" },
};
export const NotResponding: Story = {
  args: {
    model: "gemini",
    modelName: "Gemini 3 Flash",
    provider: "Google",
    status: "Not responding",
  },
};
export const CatchingUp: Story = {
  args: { status: "Catching up on earlier prompts…" },
};
