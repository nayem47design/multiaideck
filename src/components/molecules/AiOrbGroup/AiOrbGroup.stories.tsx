import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AiOrbGroup } from "./AiOrbGroup";

const meta = {
  title: "Molecules/AI orb group",
  component: AiOrbGroup,
  parameters: {
    docs: {
      description: {
        component:
          "Figma: Prototype › “Model constellation” (Thinking card, M2 Home, M20, M4 Voice).",
      },
    },
  },
  args: { size: "sm" },
} satisfies Meta<typeof AiOrbGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Small: Story = {};
export const Medium: Story = { args: { size: "md" } };
export const Large: Story = { args: { size: "lg" } };
export const ExtraLarge: Story = { args: { size: "xl" } };
