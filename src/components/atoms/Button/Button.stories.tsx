import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button, type ButtonSize, type ButtonVariant } from "./Button";

const VARIANTS: ButtonVariant[] = [
  "primary",
  "secondary",
  "ghost",
  "destructive",
  "tinted",
];
const SIZES: ButtonSize[] = ["md", "sm"];

const meta = {
  title: "Atoms/Button",
  component: Button,
  parameters: {
    layout: "centered",
    docs: {
      description: { component: "Figma: Design system › Button (28:8200)." },
    },
  },
  args: {
    children: "Button",
    variant: "primary",
    size: "md",
    loading: false,
    disabled: false,
  },
  argTypes: {
    variant: { control: "inline-radio", options: VARIANTS },
    size: { control: "inline-radio", options: SIZES },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// One story per Figma variant. The visual test renders these at md and sm.
export const Primary: Story = { args: { variant: "primary" } };
export const Secondary: Story = { args: { variant: "secondary" } };
export const Ghost: Story = { args: { variant: "ghost" } };
export const Destructive: Story = { args: { variant: "destructive" } };
export const Tinted: Story = { args: { variant: "tinted" } };

// State matrices: every variant at every size.
function Matrix(props: Partial<Story["args"]>) {
  return (
    <div className="flex flex-col gap-4 bg-canvas p-6">
      {SIZES.map((size) => (
        <div key={size} className="flex items-center gap-4">
          {VARIANTS.map((variant) => (
            <Button key={variant} variant={variant} size={size} {...props}>
              Button
            </Button>
          ))}
        </div>
      ))}
    </div>
  );
}

const matrix: Partial<Story> = {
  parameters: { layout: "fullscreen", controls: { disable: true } },
};

export const AllDefault: Story = {
  ...matrix,
  name: "State · Default",
  render: () => <Matrix />,
};
export const AllHover: Story = {
  ...matrix,
  name: "State · Hover",
  render: () => <Matrix />,
  parameters: { ...matrix.parameters, pseudo: { hover: true } },
};
export const AllPressed: Story = {
  ...matrix,
  name: "State · Pressed",
  render: () => <Matrix />,
  parameters: { ...matrix.parameters, pseudo: { hover: true, active: true } },
};
export const AllFocus: Story = {
  ...matrix,
  name: "State · Focus",
  render: () => <Matrix />,
  parameters: { ...matrix.parameters, pseudo: { focusVisible: true } },
};
export const AllDisabled: Story = {
  ...matrix,
  name: "State · Disabled",
  render: () => <Matrix disabled />,
};
export const AllLoading: Story = {
  ...matrix,
  name: "State · Loading",
  render: () => <Matrix loading />,
};
