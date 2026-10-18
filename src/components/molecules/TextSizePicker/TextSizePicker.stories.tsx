import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { TextSizePicker } from "./TextSizePicker";

// Figma: M15 · Account & settings › Reading › Text size (166:22604), 296px wide. One story per
// option, in Light and Dark.
const OPTIONS = [
  { value: "xsmall", name: "Extra small" },
  { value: "small", name: "Small" },
  { value: "normal", name: "Normal" },
  { value: "large", name: "Large" },
  { value: "larger", name: "Larger" },
];

const meta = {
  title: "Molecules/Text size picker",
  component: TextSizePicker,
  parameters: {
    docs: {
      description: {
        component:
          "Figma: M15 · Account & settings › Reading › Text size (166:22604). Five sizes; the sample letter is drawn at 10/12/14/16/19px.",
      },
    },
  },
  args: {
    label: "Text size",
    sample: "A",
    options: OPTIONS,
    value: "large",
    onValueChange: () => {},
  },
  decorators: [
    (Story) => (
      <div style={{ width: 296 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextSizePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

const dark = { globals: { theme: "dark" } };

export const ExtraSmall: Story = { args: { value: "xsmall" } };
export const ExtraSmallDark: Story = { args: { value: "xsmall" }, ...dark };
export const Small: Story = { args: { value: "small" } };
export const SmallDark: Story = { args: { value: "small" }, ...dark };
export const Normal: Story = { args: { value: "normal" } };
export const NormalDark: Story = { args: { value: "normal" }, ...dark };
/** As in Figma (M15): Large chosen. */
export const Large: Story = { args: { value: "large" } };
export const LargeDark: Story = { args: { value: "large" }, ...dark };
export const Larger: Story = { args: { value: "larger" } };
export const LargerDark: Story = { args: { value: "larger" }, ...dark };
/** In Bangla the sample letter is অ. */
export const Bangla: Story = {
  args: {
    label: "লেখার আকার",
    sample: "অ",
    options: OPTIONS.map((o, i) => ({
      ...o,
      name: ["খুব ছোট", "ছোট", "সাধারণ", "বড়", "আরও বড়"][i],
    })),
  },
};
export const Interactive: Story = {
  render: function Render(args) {
    const [value, setValue] = useState("normal");
    return <TextSizePicker {...args} value={value} onValueChange={setValue} />;
  },
};
