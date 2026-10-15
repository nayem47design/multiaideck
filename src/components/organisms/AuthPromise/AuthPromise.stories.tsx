import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AuthPromise } from "./AuthPromise";

const meta = {
  title: "Organisms/Auth promise",
  component: AuthPromise,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Figma: Prototype › Desktop · Sign in › Promise.",
      },
    },
  },
  args: {
    title: "One question.\nThree AIs.\nThe best answer.",
    body: "Ask in English or Bangla. MultiAI asks GPT, Claude and Gemini at once and shows you the best answer. You only pay, in taka, for answers you get.",
    points: [
      "No subscription needed. Top up with bKash, Nagad or card.",
      "Credits never expire.",
      "If an AI can’t answer, you’re not charged.",
    ],
  },
} satisfies Meta<typeof AuthPromise>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Dark: Story = { globals: { theme: "dark" } };
