import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Avatar } from "./Avatar";

const meta = {
  title: "Atoms/Avatar",
  component: Avatar,
  parameters: {
    docs: {
      description: { component: "Figma: Design system › Avatar (28:8270)." },
    },
  },
  args: { initials: "AH", name: "Al Imam Hossain" },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
