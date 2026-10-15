import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Skeleton } from "./Skeleton";

// Figma's Skeleton frame is 240px wide.
const meta = {
  title: "Atoms/Skeleton",
  component: Skeleton,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Skeleton (103:20580).",
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 240 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
