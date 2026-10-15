import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { UsageCard } from "./UsageCard";

// Figma's Usage card frame is 824px wide.
function frame(width: number, height?: number) {
  return function Frame(Story: () => React.JSX.Element) {
    return (
      <div style={{ width, height }}>
        <Story />
      </div>
    );
  };
}

const meta = {
  title: "Organisms/Usage card",
  component: UsageCard,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Usage card (103:20960).",
      },
    },
  },
  args: {
    title: "BY MODEL",
    total: "26 credits · ≈ BDT 0.26",
    rows: [
      {
        model: "gpt",
        name: "GPT-5",
        credits: "11 credits",
        money: "≈ BDT 0.11",
        share: 42,
      },
      {
        model: "claude",
        name: "Claude Sonnet 4",
        credits: "10 credits",
        money: "≈ BDT 0.10",
        share: 38,
      },
      {
        model: "gemini",
        name: "Gemini 3 Flash",
        credits: "5 credits",
        money: "≈ BDT 0.05",
        share: 19,
      },
    ],
    insight: {
      label: "INSIGHT",
      title: "Gemini cost about half as much as GPT-5 on the same prompt.",
      body: "If quality is close, picking Gemini for quick questions makes your credits last longer.",
      footnote: "Based on 1 prompt this month. Gets better with more chats.",
    },
  },
  decorators: [frame(824)],
} satisfies Meta<typeof UsageCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
