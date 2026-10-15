import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PromptSummary } from "./PromptSummary";

const meta = {
  title: "Molecules/Prompt summary",
  component: PromptSummary,
  parameters: {
    docs: {
      description: {
        component:
          "Not a Figma component yet: “Prompt 1 (collapsed)” on Compare · Prompt 2 and Prompt 3.",
      },
    },
  },
  args: {
    label: "Prompt 1",
    prompt: "Give me 3 name ideas for a small coffee shop in Dhaka",
    results: [
      { model: "claude", label: "Claude · 1.4 cr" },
      { model: "gpt", label: "GPT-5 · 0.9 cr" },
      { model: "gemini", label: "Gemini · 0.3 cr" },
    ],
    toggleLabel: "Show",
  },
  decorators: [
    (Story) => (
      <div style={{ width: 1112 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PromptSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithRefunds: Story = {
  args: {
    label: "Prompt 2",
    prompt: "Make them sound more premium",
    results: [
      { model: "claude", label: "Claude · 1.3 cr" },
      { model: "gpt", label: "GPT-5 · refunded", refunded: true },
      { model: "gemini", label: "Gemini · refunded", refunded: true },
    ],
  },
};
export const Expanded: Story = {
  args: { toggleLabel: "Hide", expanded: true },
};
