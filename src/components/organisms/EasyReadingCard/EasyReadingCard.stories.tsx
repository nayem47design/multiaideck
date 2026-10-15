import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { EasyReadingCard } from "./EasyReadingCard";

const meta = {
  title: "Organisms/Easy reading card",
  component: EasyReadingCard,
  parameters: {
    docs: {
      description: {
        component: "Figma: Prototype › M15 · Account & settings › Reading.",
      },
    },
  },
  args: {
    title: "Easy reading",
    label: "Text size",
    options: [
      { value: "normal", label: "Normal" },
      { value: "large", label: "Large" },
      { value: "larger", label: "Larger" },
    ],
    value: "large",
    onValueChange: () => {},
    help: "Answers and buttons get bigger. Works with your phone’s font size too.",
  },
  decorators: [
    (Story) => (
      <div style={{ width: 328 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EasyReadingCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** As in Figma: Large selected. */
export const Default: Story = {};
export const Interactive: Story = {
  render: function Render(args) {
    const [value, setValue] = useState("normal");
    return <EasyReadingCard {...args} value={value} onValueChange={setValue} />;
  },
};
