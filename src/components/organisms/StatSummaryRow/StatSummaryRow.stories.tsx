import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StatSummaryRow } from "./StatSummaryRow";

// Figma's Stat summary row frame is 1120 × 174px.
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
  title: "Organisms/Stat summary row",
  component: StatSummaryRow,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Stat summary row (103:20772).",
      },
    },
  },
  args: {
    stats: [
      {
        label: "BALANCE",
        value: "10,684 credits",
        caption: "≈ BDT 106.84 · about 410 chats at your average",
        chip: "Credits never expire",
      },
      {
        label: "SPENT THIS MONTH",
        value: "26 credits",
        caption: "≈ BDT 0.26 · 1 chat this month",
      },
      {
        label: "PLAN",
        value: "Pay as you go",
        caption: "No subscription. Top up when you need.",
        action: { label: "Upgrade Now", link: <a href="#" /> },
      },
    ],
  },
  decorators: [frame(1120, 174)],
} satisfies Meta<typeof StatSummaryRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
