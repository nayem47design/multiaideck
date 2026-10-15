import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProPriceCard } from "./ProPriceCard";

const meta = {
  title: "Molecules/Pro price card",
  component: ProPriceCard,
  parameters: {
    docs: {
      description: { component: "Figma: Prototype › M37 · Go Pro › Pro card." },
    },
  },
  args: {
    name: "MultiAI Pro",
    price: "৳1,599",
    period: "a month",
    tagline: "For people who use AI every day.",
  },
  decorators: [
    (Story) => (
      <div style={{ width: 328 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProPriceCard>;

export default meta;
export const Default: StoryObj<typeof meta> = {};
