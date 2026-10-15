import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Banner } from "./Banner";

// Figma's Banner frames are 520px wide.
function frame(width: number) {
  return function Frame(Story: () => React.JSX.Element) {
    return (
      <div style={{ width }}>
        <Story />
      </div>
    );
  };
}

const meta = {
  title: "Molecules/Banner",
  component: Banner,
  parameters: {
    docs: {
      description: { component: "Figma: Design system › Banner (103:20666)." },
    },
  },
  args: {
    tone: "info",
    title: "Notifications start soon",
    body: "Set your choices now. They apply from launch day.",
  },
  decorators: [frame(520)],
} satisfies Meta<typeof Banner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {};
export const Warning: Story = {
  args: {
    tone: "warning",
    title: "20 credits left, about 5 answers",
    body: "Top up from BDT 50 to keep going.",
  },
};
export const Error: Story = {
  args: {
    tone: "error",
    title: "Payment didn’t go through",
    body: "No money was taken. Try again.",
  },
};
