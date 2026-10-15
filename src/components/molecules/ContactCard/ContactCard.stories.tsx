import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ContactCard } from "./ContactCard";

const meta = {
  title: "Molecules/Contact card",
  component: ContactCard,
  parameters: {
    docs: {
      description: {
        component:
          "Figma: Prototype › Settings · Help & support › Contact · * (below 768px: M42 · Help & support).",
      },
    },
  },
  args: {
    icon: "bubble-chat",
    title: "Chat with us",
    body: "A person replies in a few minutes, 9am–9pm every day.",
    actionLabel: "Start chat",
    link: <a href="#" />,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 404, display: "flex" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ContactCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Call: Story = {
  args: {
    icon: "smart-phone-01",
    title: "Call us",
    body: "Free call, in Bangla or English, 9am–9pm.",
    actionLabel: "Call now",
  },
};
/** Below 768px (M42): smaller card, no button. */
export const Mobile: Story = {
  globals: { viewport: { value: "mobile1" } },
  decorators: [
    (Story) => (
      <div style={{ width: 159, display: "flex" }}>
        <Story />
      </div>
    ),
  ],
  args: { body: "Reply in a few minutes, 9am–9pm" },
};
