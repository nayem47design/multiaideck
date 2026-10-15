import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Divider } from "./Divider";

// Figma's Divider frames are 200px wide (horizontal) and 40px tall (vertical).
const meta = {
  title: "Atoms/Divider",
  component: Divider,
  parameters: {
    docs: {
      description: { component: "Figma: Design system › Divider (103:20562)." },
    },
  },
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => (
    <div style={{ width: 200 }}>
      <Divider />
    </div>
  ),
};
export const Vertical: Story = {
  render: () => (
    <div className="flex h-10">
      <Divider orientation="vertical" />
    </div>
  ),
};
