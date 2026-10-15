import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ModelOrbStack } from "./ModelOrbStack";

const meta = {
  title: "Molecules/Model orb stack",
  component: ModelOrbStack,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Figma: Prototype › Chats › Chat rows › orbs (md), Presets › orbs (lg), M14 (tight).",
      },
    },
  },
  args: { models: ["gpt", "claude", "gemini"] },
} satisfies Meta<typeof ModelOrbStack>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Medium: Story = {};
export const Large: Story = { args: { size: "lg" } };
export const Tight: Story = { args: { overlap: "tight" } };
export const One: Story = { args: { models: ["gemini"] } };
export const Dark: Story = { globals: { theme: "dark" } };
