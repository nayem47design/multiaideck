import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AiOrb } from "./AiOrb";

const meta = {
  title: "Atoms/AI orb",
  component: AiOrb,
  parameters: {
    docs: {
      description: { component: "Figma: Design system › AI orb (28:8289)." },
    },
  },
} satisfies Meta<typeof AiOrb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
