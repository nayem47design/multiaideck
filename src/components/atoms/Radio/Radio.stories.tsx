import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Radio, RadioGroup } from "./Radio";

const meta = {
  title: "Atoms/Radio",
  component: Radio,
  parameters: {
    docs: {
      description: { component: "Figma: Design system › Radio (28:8256)." },
    },
  },
  args: { value: "a", "aria-label": "Option" },
  render: (args, { parameters }) => (
    <RadioGroup
      aria-label="Options"
      defaultValue={parameters.selected ? "a" : undefined}
    >
      <Radio {...args} />
    </RadioGroup>
  ),
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Selected: Story = { parameters: { selected: true } };
export const Unselected: Story = { parameters: { selected: false } };
export const StateFocus: Story = {
  name: "State · Focus",
  parameters: { selected: true, pseudo: { focusVisible: true } },
};
export const StateDisabled: Story = {
  name: "State · Disabled",
  args: { disabled: true },
};
