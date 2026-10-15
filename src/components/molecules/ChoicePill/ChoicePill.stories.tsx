import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ChoicePill } from "./ChoicePill";

const meta = {
  title: "Molecules/Choice pill",
  component: ChoicePill,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Figma: Prototype › Chats › Filters and Image studio › Style pills; lg from M21 · Make a picture.",
      },
    },
  },
  args: { children: "Drawing" },
} satisfies Meta<typeof ChoicePill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Selected: Story = { args: { selected: true } };
export const Large: Story = { args: { size: "lg" } };
export const LargeSelected: Story = { args: { size: "lg", selected: true } };
export const Disabled: Story = { args: { disabled: true } };
export const DarkSelected: Story = {
  args: { selected: true },
  globals: { theme: "dark" },
};
