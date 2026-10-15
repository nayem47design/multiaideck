import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RecentUsageCard } from "./RecentUsageCard";

const meta = {
  title: "Organisms/Recent usage card",
  component: RecentUsageCard,
  parameters: {
    docs: {
      description: { component: "Figma: Prototype › M13 · Usage › Activity." },
    },
  },
  args: {
    title: "Recent questions",
    items: [
      {
        id: "hellow",
        title: "Hellow",
        meta: "Today, 1:29 PM · 3 AIs",
        amount: "26 cr",
        models: ["gpt", "claude", "gemini"],
        link: <a href="#" />,
      },
    ],
    footnote:
      "If an AI fails or you stop it, those credits come back and show here as “Refunded”.",
  },
  decorators: [
    (Story) => (
      <div style={{ width: 328 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RecentUsageCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = {
  args: { items: [], emptyLabel: "No questions this month yet." },
};
