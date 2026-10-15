import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Select } from "./Select";

// Figma's Select frame is 200px wide.
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
  title: "Molecules/Select",
  component: Select,
  parameters: {
    docs: {
      description: { component: "Figma: Design system › Select (103:20625)." },
    },
  },
  args: {
    label: "Model version",
    defaultValue: "flash",
    options: [
      { value: "flash", label: "3 Flash Preview" },
      { value: "pro", label: "3 Pro" },
      { value: "lite", label: "2.5 Flash-Lite" },
    ],
  },
  decorators: [frame(200)],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Open: Story = { args: { open: true } };
export const StateDisabled: Story = {
  name: "State · Disabled",
  args: { disabled: true },
};
