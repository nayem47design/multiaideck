import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ThinkingStatusBar } from "./ThinkingStatusBar";

const meta = {
  title: "Molecules/Thinking status bar",
  component: ThinkingStatusBar,
  parameters: {
    docs: {
      description: {
        component:
          "Not a Figma component yet: “Status bar” on Thinking · Compare and the Prompt 2 / 3 thinking screens.",
      },
    },
  },
  args: { title: "Asking 3 AIs…", message: "1 of 3 done", stopLabel: "Stop" },
} satisfies Meta<typeof ThinkingStatusBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Progress: Story = {};
export const Slow: Story = {
  args: {
    message:
      "2 AIs are slow. We stop waiting after 30 s; you won’t pay for them.",
  },
};
export const CatchingUp: Story = {
  args: { message: "GPT-5 and Gemini first read your earlier prompts" },
};
