import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ModelConstellation } from "./ModelConstellation";

const meta = {
  title: "Atoms/Model constellation",
  component: ModelConstellation,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Figma: Prototype › Desktop · Sign in › Promise › Model constellation (same layer as Home hero).",
      },
    },
  },
} satisfies Meta<typeof ModelConstellation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Dark: Story = { globals: { theme: "dark" } };
