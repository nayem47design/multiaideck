import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProComparisonCard } from "./ProComparisonCard";

const meta = {
  title: "Organisms/Pro comparison card",
  component: ProComparisonCard,
  parameters: {
    docs: {
      description: {
        component: "Figma: Prototype › Wallet › Pro comparison (28:9923).",
      },
    },
  },
  args: {
    title: "Use AI every day? Try Pro",
    columns: { payg: "Pay as you go", pro: "Pro" },
    rows: [
      { label: "Price", payg: "From BDT 99", pro: "BDT 1,599 / month" },
      { label: "Credits", payg: "What you buy", pro: "159,900 every month" },
      { label: "Expiry", payg: "Never", pro: "Reset monthly" },
      { label: "Models", payg: "All", pro: "All + premium, video" },
    ],
    action: { label: "See Pro details" },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 376 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProComparisonCard>;

export default meta;
export const Default: StoryObj<typeof meta> = {};
