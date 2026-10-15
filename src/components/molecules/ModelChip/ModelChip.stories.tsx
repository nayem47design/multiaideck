import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ModelChip } from "./ModelChip";

const meta = {
  title: "Molecules/Model chip",
  component: ModelChip,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Model chip (28:8335).",
      },
    },
  },
  args: { model: "gpt", label: "GPT-5", removeLabel: "Remove GPT-5" },
} satisfies Meta<typeof ModelChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
