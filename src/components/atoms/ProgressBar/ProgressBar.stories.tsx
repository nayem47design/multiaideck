import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProgressBar } from "./ProgressBar";

// Figma's Progress bar frames are 200px wide: 120 / 200 / 170px filled.
const meta = {
  title: "Atoms/Progress bar",
  component: ProgressBar,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Progress bar (103:20579).",
      },
    },
  },
  args: { "aria-label": "Credits used", value: 60 },
  decorators: [
    (Story) => (
      <div style={{ width: 200 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InProgress: Story = { args: { value: 60, state: "in-progress" } };
export const Done: Story = { args: { value: 100, state: "done" } };
export const NearLimit: Story = { args: { value: 85, state: "near-limit" } };
