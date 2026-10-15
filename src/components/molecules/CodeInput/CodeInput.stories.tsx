import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { CodeInput, type CodeInputProps } from "./CodeInput";

function Stateful(props: CodeInputProps) {
  const [value, setValue] = useState(props.value);
  return <CodeInput {...props} value={value} onChange={setValue} />;
}

const meta = {
  title: "Molecules/Code input",
  component: CodeInput,
  render: (args) => <Stateful {...args} />,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Figma: Prototype › Desktop · Enter code › Code boxes; M17 · Enter the code below 768px. Type, Backspace, arrows and paste work.",
      },
    },
  },
  args: {
    value: "",
    onChange: () => {},
    label: "6-digit code",
    digitLabel: (n: number) => `Digit ${n}`,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 376 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CodeInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Partly: Story = { args: { value: "482", autoFocus: true } };
export const Filled: Story = { args: { value: "482913" } };
export const Invalid: Story = { args: { value: "482913", invalid: true } };
export const Disabled: Story = { args: { value: "482913", disabled: true } };
export const Dark: Story = {
  args: { value: "482" },
  globals: { theme: "dark" },
};
