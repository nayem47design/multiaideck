import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PhoneInput } from "./PhoneInput";

const meta = {
  title: "Molecules/Phone input",
  component: PhoneInput,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Figma: Prototype › Desktop · Sign in › Phone field; M16 · Sign in: phone number › Phone field below 768px.",
      },
    },
  },
  args: {
    prefix: "+880",
    countryLabel: "Bangladesh",
    "aria-label": "Mobile number",
    placeholder: "1712 345 214",
  },
  decorators: [
    (Story) => (
      <div style={{ width: 376 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PhoneInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Filled: Story = { args: { defaultValue: "1712 345 214" } };
export const Focused: Story = {
  args: { defaultValue: "1712 345 214", autoFocus: true },
};
export const Invalid: Story = { args: { defaultValue: "1712", invalid: true } };
export const Disabled: Story = {
  args: { defaultValue: "1712 345 214", disabled: true },
};
export const Dark: Story = {
  args: { defaultValue: "1712 345 214" },
  globals: { theme: "dark" },
};
