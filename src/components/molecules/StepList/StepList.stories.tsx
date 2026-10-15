import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StepList } from "./StepList";

const meta = {
  title: "Molecules/Step list",
  component: StepList,
  parameters: {
    docs: {
      description: {
        component: "Figma: Prototype › M34 · Finish payment in bKash › Steps.",
      },
    },
  },
  args: {
    steps: [
      { label: "Opened bKash", done: true },
      { label: "Enter your PIN in bKash" },
      { label: "Credits added here" },
    ],
  },
  decorators: [
    (Story) => (
      <div style={{ width: 328 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StepList>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Waiting: Story = {};
export const AllDone: Story = {
  args: {
    steps: [
      { label: "Opened bKash", done: true },
      { label: "Enter your PIN in bKash", done: true },
      { label: "Credits added here", done: true },
    ],
  },
};
