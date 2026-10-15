import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { OrderSummary } from "./OrderSummary";

// Figma's Order summary frame is 376px wide.
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
  title: "Organisms/Order summary",
  component: OrderSummary,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Order summary (28:8693).",
      },
    },
  },
  args: {
    title: "ORDER SUMMARY",
    total: { label: "You pay", value: "BDT 699" },
    sections: [
      [
        { label: "Credits", value: "69,900" },
        { label: "Bonus (+10%)", value: "+ 6,990", tone: "success" },
        { label: "You get", value: "76,890 credits", strong: true },
      ],
      [
        { label: "New balance", value: "87,574 credits" },
        { value: "≈ BDT 875.74", kind: "note" },
      ],
    ],
    payLabel: "Pay BDT 699 with bKash",
    trust: [
      { icon: "square-lock-02", label: "Secured by PayStation" },
      {
        icon: "shield-01",
        label: "Failed payments are never charged.",
        tone: "success",
      },
    ],
  },
  decorators: [frame(376)],
} satisfies Meta<typeof OrderSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
