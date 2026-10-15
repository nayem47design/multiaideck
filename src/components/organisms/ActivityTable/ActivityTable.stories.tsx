import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ActivityTable } from "./ActivityTable";

// Figma's Activity table frame is 1120px wide, with the first row open.
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
  title: "Organisms/Activity table",
  component: ActivityTable,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Activity table (103:21035).",
      },
    },
  },
  args: {
    columns: {
      date: "DATE",
      chat: "CHAT",
      models: "MODELS",
      credits: "CREDITS",
      money: "TAKA",
    },
    rows: [
      {
        id: "1",
        date: "Oct 14 · 1:29 PM",
        chat: "Hellow",
        models: ["gpt", "claude", "gemini"],
        modelsLabel: "3 models",
        credits: "26 credits",
        money: "≈ BDT 0.26",
        breakdown: [
          {
            model: "gpt",
            name: "GPT-5",
            credits: "11 credits",
            money: "≈ BDT 0.11",
          },
          {
            model: "claude",
            name: "Claude Sonnet 4",
            credits: "10 credits",
            money: "≈ BDT 0.10",
          },
          {
            model: "gemini",
            name: "Gemini 3 Flash",
            credits: "5 credits",
            money: "≈ BDT 0.05",
          },
        ],
      },
    ],
    openId: "1",
    toggleLabel: (chat: string) => `Show models for ${chat}`,
    footnote: "Usage is grouped by chat. Open a row to see each model’s share.",
  },
  decorators: [frame(1120)],
} satisfies Meta<typeof ActivityTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
