import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ChecklistCard } from "./ChecklistCard";

const meta = {
  title: "Molecules/Checklist card",
  component: ChecklistCard,
  parameters: {
    docs: {
      description: {
        component:
          "Figma: Prototype › M35 › Common reasons (dot) and M37 · Go Pro › What you get (tick).",
      },
    },
  },
  args: {
    title: "Common reasons",
    items: [
      "Wrong PIN or the time ran out",
      "Not enough balance in bKash",
      "The bKash app was closed too early",
    ],
  },
  decorators: [
    (Story) => (
      <div style={{ width: 328 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChecklistCard>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Reasons: Story = {};
export const Benefits: Story = {
  args: {
    title: undefined,
    marker: "tick",
    items: [
      "159,900 credits every month (about 6,000 questions)",
      "All AIs, including premium and video",
      "Credits reset each month; cancel any time",
      "Priority when AIs are busy",
    ],
  },
};
