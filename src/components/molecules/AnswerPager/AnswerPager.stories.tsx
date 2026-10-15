import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AnswerPager } from "./AnswerPager";

const meta = {
  title: "Molecules/Answer pager",
  component: AnswerPager,
  parameters: {
    docs: {
      description: {
        component:
          "Not a Figma component yet: “Pager” on mobile Compare (M6, M8, M23–M33).",
      },
    },
  },
  args: {
    count: 3,
    index: 0,
    hint: "Swipe for the next answer",
    label: "Answer 1 of 3",
  },
} satisfies Meta<typeof AnswerPager>;

export default meta;
type Story = StoryObj<typeof meta>;

export const First: Story = {};
export const Second: Story = { args: { index: 1, label: "Answer 2 of 3" } };
export const Partial: Story = {
  args: { hint: "1 of 3 answered · swipe to see Claude" },
};
