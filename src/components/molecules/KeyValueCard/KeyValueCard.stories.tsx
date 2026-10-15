import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { KeyValueCard } from "./KeyValueCard";

const meta = {
  title: "Molecules/Key value card",
  component: KeyValueCard,
  parameters: {
    docs: {
      description: {
        component: "Figma: Prototype › M12 · Payment received › Receipt.",
      },
    },
  },
  args: {
    sections: [
      [
        { label: "New balance", value: "87,574 credits", strong: true },
        { label: "In taka", value: "about ৳875.74" },
      ],
      [
        { label: "You paid", value: "৳699 with bKash" },
        { label: "Bonus", value: "+6,990 credits (10%)" },
        { label: "Transaction ID", value: "8XK2-41QD" },
        { label: "Date", value: "Oct 15, 11:52 AM" },
      ],
    ],
  },
  decorators: [
    (Story) => (
      <div style={{ width: 328 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof KeyValueCard>;

export default meta;
export const Receipt: StoryObj<typeof meta> = {};
