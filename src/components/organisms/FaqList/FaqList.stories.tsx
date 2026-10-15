import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FaqList } from "./FaqList";

const meta = {
  title: "Organisms/FAQ list",
  component: FaqList,
  parameters: {
    docs: {
      description: {
        component:
          "Figma: Prototype › Settings · Help & support › FAQ (below 768px: M42 › FAQ).",
      },
    },
  },
  args: {
    items: [
      {
        id: "credit",
        question: "What is a credit, and how much does a question cost?",
        answer:
          "A credit is how MultiAI counts AI use. 1 credit is BDT 0.01. Each question shows its cost before you send it.",
      },
      {
        id: "failed",
        question: "Why didn’t one of the AIs answer?",
        answer:
          "Sometimes a model is busy or times out. You are not charged for an answer that fails. Tap Retry to ask it again.",
      },
      {
        id: "bangla",
        question: "Can I ask in Bangla?",
        answer: "Yes. Ask in Bangla or English, whichever you prefer.",
      },
    ],
  },
  decorators: [
    (Story) => (
      <div style={{ width: 824 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FaqList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** As in Figma: every question closed. */
export const Default: Story = {};
export const Open: Story = { args: { defaultValue: "failed" } };
