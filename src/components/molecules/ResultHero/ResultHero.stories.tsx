import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ResultHero } from "./ResultHero";

const meta = {
  title: "Molecules/Result hero",
  component: ResultHero,
  parameters: {
    docs: {
      description: {
        component:
          "Figma: Prototype › M12 · Payment received (Success), M35 (Failed), M38 · Pro is on, Overlay · Pro is on.",
      },
    },
  },
  args: {
    tone: "success",
    title: "Payment received",
    body: "76,890 credits added to your wallet.",
  },
  decorators: [
    (Story) => (
      <div style={{ width: 328 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ResultHero>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Success: Story = {};
export const Failed: Story = {
  args: {
    tone: "error",
    title: "Payment didn’t go through",
    body: "bKash didn’t confirm the payment. No money was taken from your account.",
  },
};
export const Pro: Story = {
  args: {
    tone: "pro",
    title: "You’re on Pro",
    body: "159,900 credits added. Your next payment of ৳1,599 is on Nov 15. Cancel any time in Wallet.",
  },
};
export const ProDialog: Story = { args: { ...Pro.args, size: "md", as: "h2" } };
