import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Input } from "./Input";

// Figma's Input frame is 280px wide; the component itself fills its container.
const meta = {
  title: "Atoms/Input",
  component: Input,
  parameters: {
    docs: {
      description: { component: "Figma: Design system › Input (28:8284)." },
    },
  },
  args: { placeholder: "Placeholder", "aria-label": "Name" },
  decorators: [
    (Story) => (
      <div style={{ width: 280 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Focus: Story = {
  args: { defaultValue: "Al Imam Hossain" },
  parameters: { pseudo: { focus: true } },
};
export const ReadOnly: Story = {
  args: { defaultValue: "Al Imam Hossain", readOnly: true },
};
export const Error: Story = {
  args: { defaultValue: "Al Imam Hossain", "aria-invalid": true },
};
export const StateDisabled: Story = {
  name: "State · Disabled",
  args: { defaultValue: "Al Imam Hossain", disabled: true },
};
