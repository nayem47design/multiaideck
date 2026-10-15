import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MobileAnswerCard } from "./MobileAnswerCard";

const LABELS = {
  copy: "Copy",
  helpful: "Helpful",
  notHelpful: "Not helpful",
  use: "Use this answer",
};

const meta: Meta<typeof MobileAnswerCard> = {
  title: "Organisms/Mobile answer card",
  component: MobileAnswerCard,
  parameters: {
    docs: {
      description: {
        component:
          "Not a Figma component yet: “Answer card · <model>” on mobile Compare (M6, M8, M23–M33).",
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 328 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MobileAnswerCard>;

/** M6 · Claude, suggested. */
export const Suggested: Story = {
  args: {
    model: "claude",
    modelName: "Claude Sonnet 4",
    meta: "2.6 seconds · 1.4 credits (৳0.01)",
    note: { tone: "info", text: "Suggested: most complete answer, mid cost" },
    suggested: true,
    children:
      "Three ideas, with the feeling each one gives:\n\n1. Golpo Coffee: “golpo” means story, a place to sit and talk.\n2. Third Place: for people who stay and work.\n3. Morning Ritual: calm and a little premium.",
    labels: LABELS,
  },
};
/** M23 · GPT-5, no note. */
export const Default: Story = {
  args: {
    model: "gpt",
    modelName: "GPT-5",
    meta: "1.8 seconds · 0.9 credits (৳0.01)",
    children:
      "Here are three ideas:\n\n1. Brew Lane\n2. Cha & Crema\n3. Dhaka Drip",
    labels: LABELS,
  },
};
/** M24 · Gemini, success note. */
export const SuccessNote: Story = {
  args: {
    model: "gemini",
    modelName: "Gemini 3 Flash",
    meta: "0.9 seconds · 0.3 credits (৳0.003)",
    note: { tone: "success", text: "Fastest and cheapest of the three" },
    children: "1. Bean Bari (“bari” means home)\n2. Cup & Chai\n3. Roast Dhaka",
    labels: LABELS,
  },
};
/** M8 · GPT-5 timed out. */
export const FailedTimeout: Story = {
  args: {
    state: "failed",
    model: "gpt",
    title: "GPT-5 couldn’t answer this time",
    body: "It took too long to reply (over 30 seconds). This happens when an AI is busy.",
    refund: "You were not charged for this.",
    actions: [
      {
        label: "Try again · about 0.9 credits",
        icon: "reload",
        tone: "tinted",
      },
      { label: "Ask a different AI", tone: "secondary" },
    ],
  },
};
/** M28 · Gemini unavailable. */
export const FailedUnavailable: Story = {
  args: {
    state: "failed",
    model: "gemini",
    title: "Gemini isn’t available right now",
    body: "Google’s service is having problems. Trying again now usually won’t help.",
    refund: "You were not charged for this.",
    actions: [
      { label: "Ask a different AI", tone: "tinted" },
      { label: "Try again later", icon: "reload", tone: "secondary" },
    ],
  },
};
