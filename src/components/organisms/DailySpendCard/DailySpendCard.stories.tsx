import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DailySpendCard } from "./DailySpendCard";

const days = Array.from({ length: 14 }, (_, i) => ({
  key: String(i + 1),
  label: `Oct ${i + 1}`,
  showLabel: i === 0 || i === 6 || i === 13,
  value: i === 13 ? 26 : 0,
  valueLabel: i === 13 ? "26 cr" : "0 cr",
}));

const meta = {
  title: "Organisms/Daily spend card",
  component: DailySpendCard,
  parameters: {
    docs: {
      description: {
        component: "Figma: Prototype › Settings · Usage › Daily spend card.",
      },
    },
  },
  args: {
    days,
    label: "Credits spent per day, Oct 1–14",
    footer: (
      <p className="flex gap-2 type-ui text-ink-2">
        No spending limit set.
        <a href="#" className="type-ui-strong text-blue">
          Set a limit in Wallet
        </a>
      </p>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ width: 824 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DailySpendCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** As in Figma: one day with spend. */
export const Default: Story = {};
export const SeveralDays: Story = {
  name: "Several days",
  args: {
    days: days.map((d, i) => ({
      ...d,
      value: [0, 4, 0, 12, 8, 0, 3, 0, 0, 20, 6, 0, 9, 26][i],
      valueLabel: `${[0, 4, 0, 12, 8, 0, 3, 0, 0, 20, 6, 0, 9, 26][i]} cr`,
    })),
  },
};
