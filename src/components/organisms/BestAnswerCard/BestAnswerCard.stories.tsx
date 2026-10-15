import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { BestAnswerCard } from "./BestAnswerCard";

// Figma's Best answer card frame is 760px wide.
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
  title: "Organisms/Best answer card",
  component: BestAnswerCard,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Best answer card (103:21254).",
      },
    },
  },
  args: {
    models: ["gpt", "claude", "gemini"],
    title: "Best answer",
    builtFrom: "Built from GPT, Claude and Gemini",
    intro: "Here are the strongest name ideas from all three models:",
    points: [
      {
        lead: "Golpo Coffee:",
        text: '"golpo" means story: a place to sit and talk.',
        model: "claude",
        source: "from Claude",
      },
      {
        lead: "Bean Bari:",
        text: '"bari" means home: warm and local.',
        model: "gemini",
        source: "from Gemini",
      },
      {
        lead: "Cha & Crema:",
        text: "Dhaka’s tea culture meets espresso.",
        model: "gpt",
        source: "from GPT",
      },
    ],
    metrics: ["3.1 s", "286 tokens", "2.8 cr", "≈ BDT 0.03"],
    seeAllLabel: "See all 3 answers side by side",
    whyLabel: "Why this answer?",
  },
  decorators: [frame(760)],
} satisfies Meta<typeof BestAnswerCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
