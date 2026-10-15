import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PaymentsTable } from "./PaymentsTable";

// Figma's Payments table frame is 1120px wide.
function frame(width: number, height?: number) {
  return function Frame(Story: () => React.JSX.Element) {
    return (
      <div style={{ width, height }}>
        <Story />
      </div>
    );
  };
}

const failed = { label: "Failed · not charged", tone: "error" as const };

const meta = {
  title: "Organisms/Payments table",
  component: PaymentsTable,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Payments table (103:29333).",
      },
    },
  },
  args: {
    columns: { date: "DATE", topUp: "TOP-UP", status: "STATUS" },
    rows: [
      {
        id: "1",
        date: "Oct 14 · 12:38 PM",
        topUp: "BDT 2,499 via bKash",
        status: failed,
        action: { label: "Try again" },
      },
      {
        id: "2",
        date: "Oct 13 · 4:32 PM",
        topUp: "BDT 199 via bKash",
        status: failed,
        action: { label: "Try again" },
      },
    ],
    footnote:
      'Successful top-ups show a "Receipt" download here, replacing the separate Invoices card.',
  },
  decorators: [frame(1120)],
} satisfies Meta<typeof PaymentsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
