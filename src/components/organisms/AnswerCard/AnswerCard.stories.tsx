import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AnswerCard } from "./AnswerCard";

const ANSWER =
  "Three ideas, with the feeling each one gives:\n\n1. Golpo Coffee: “golpo” means story, a place to sit and talk.\n2. Third Place: for people who stay and work.\n3. Morning Ritual: calm and a little premium.\n\nWant me to check which names are free as Facebook pages?";

const meta = {
  title: "Organisms/Answer card",
  component: AnswerCard,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Answer card (103:25291).",
      },
    },
  },
  args: {
    state: "default",
    model: "claude",
    modelName: "Claude Sonnet 4",
    provider: "Anthropic",
    children: ANSWER,
    metrics: ["2.6 s", "142 tokens", "1.4 cr"],
    badge: "Suggested",
    labels: {
      close: "Close",
      copy: "Copy",
      retry: "Retry",
      helpful: "Helpful",
      notHelpful: "Not helpful",
      continue: "Continue with Claude",
      swapModel: "Swap model",
      retryWithCost: "Retry · ≈ 0.9 cr",
    },
  },
} satisfies Meta<typeof AnswerCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Suggested: Story = { args: { state: "suggested" } };
export const Default: Story = {};
export const Failed: Story = {
  args: {
    state: "failed",
    badge: "Couldn’t answer",
    refund: "Refunded · 0 cr",
  },
};
