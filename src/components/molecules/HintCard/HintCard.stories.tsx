import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { HintCard } from "./HintCard";

const meta = {
  title: "Molecules/Hint card",
  component: HintCard,
  parameters: {
    docs: {
      description: {
        component: "Figma: Prototype › M10 · Wallet › How credits work.",
      },
    },
  },
  args: {
    title: "How credits work",
    body: "100 credits = ৳1. A normal question costs about 2 to 15 credits. If an AI can’t answer, you pay nothing.",
  },
  decorators: [
    (Story) => (
      <div style={{ width: 328 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HintCard>;

export default meta;
export const Default: StoryObj<typeof meta> = {};
