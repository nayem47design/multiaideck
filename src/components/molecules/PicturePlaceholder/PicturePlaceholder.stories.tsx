import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PicturePlaceholder } from "./PicturePlaceholder";

const meta = {
  title: "Molecules/Picture placeholder",
  component: PicturePlaceholder,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Figma: Prototype › Image studio › Recent pictures and Picture ready › Picture (generated image placeholder).",
      },
    },
  },
  args: { tone: "warm", caption: "Golpo Coffee", size: "lg" },
  decorators: [
    (Story) => (
      <div style={{ width: 520 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PicturePlaceholder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};
export const Mobile: Story = {
  args: { size: "md" },
  decorators: [
    (Story) => (
      <div style={{ width: 328 }}>
        <Story />
      </div>
    ),
  ],
};
export const Tiles: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 12,
      }}
    >
      {(["warm", "blue", "green", "pink"] as const).map((tone) => (
        <PicturePlaceholder key={tone} tone={tone} size="sm" />
      ))}
    </div>
  ),
};
export const Pending: Story = { args: { pending: true } };
export const Dark: Story = { globals: { theme: "dark" } };
