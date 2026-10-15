import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { IconButton, type IconButtonVariant } from "./IconButton";

const VARIANTS: IconButtonVariant[] = [
  "plain",
  "outline",
  "glass",
  "send",
  "stop",
];

const meta = {
  title: "Atoms/Icon button",
  component: IconButton,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Icon button (28:8212).",
      },
    },
  },
  args: { label: "Add", variant: "plain" },
  argTypes: { variant: { control: "inline-radio", options: VARIANTS } },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = { args: { variant: "plain" } };
export const Outline: Story = { args: { variant: "outline" } };
export const Glass: Story = { args: { variant: "glass" } };
export const Send: Story = { args: { variant: "send", label: "Send" } };
export const Stop: Story = { args: { variant: "stop", label: "Stop" } };

const Row = (props: Partial<Story["args"]>) => (
  <div className="flex items-center gap-4 bg-canvas p-6">
    {VARIANTS.map((v) => (
      <IconButton key={v} variant={v} label={v} {...props} />
    ))}
  </div>
);
const matrix = {
  parameters: { layout: "fullscreen", controls: { disable: true } },
};
export const StateHover: Story = {
  ...matrix,
  name: "State · Hover",
  render: () => <Row />,
  parameters: { ...matrix.parameters, pseudo: { hover: true } },
};
export const StatePressed: Story = {
  ...matrix,
  name: "State · Pressed",
  render: () => <Row />,
  parameters: { ...matrix.parameters, pseudo: { hover: true, active: true } },
};
export const StateFocus: Story = {
  ...matrix,
  name: "State · Focus",
  render: () => <Row />,
  parameters: { ...matrix.parameters, pseudo: { focusVisible: true } },
};
export const StateDisabled: Story = {
  ...matrix,
  name: "State · Disabled",
  render: () => <Row disabled />,
};
