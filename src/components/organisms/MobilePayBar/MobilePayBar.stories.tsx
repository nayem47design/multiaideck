import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MobilePayBar } from "./MobilePayBar";

const meta = {
  title: "Organisms/Mobile pay bar",
  component: MobilePayBar,
  parameters: {
    docs: {
      description: {
        component:
          "Figma: Prototype › M11 · Add credits: amount & bKash › Pay bar.",
      },
    },
  },
  args: {
    summary: "You get 76,890 credits",
    detail: "New balance 87,574",
    payLabel: "Pay ৳699 with bKash",
    note: "Secured by PayStation · failed payments are never charged",
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MobilePayBar>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = {
  args: { summary: "Choose an amount", detail: undefined, disabled: true },
};
