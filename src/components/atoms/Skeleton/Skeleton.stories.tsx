import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Skeleton } from "./Skeleton";

// Figma: Design system › Skeleton (298:56113). Each story is as wide as its Figma variant.
const meta = {
  title: "Atoms/Skeleton",
  component: Skeleton,
  parameters: {
    width: 240,
    docs: {
      description: {
        component:
          "Figma: Design system › Skeleton (298:56113): Lines, Row, Table row, Card, Tile.",
      },
    },
  },
  decorators: [
    (Story, { parameters }) => (
      <div style={{ width: parameters.width as number }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Row: Story = {
  args: { variant: "row" },
  parameters: { width: 842 },
};
export const TableRow: Story = {
  args: { variant: "table-row" },
  parameters: { width: 824 },
};
export const Card: Story = {
  args: { variant: "card" },
  parameters: { width: 422 },
};
export const Tile: Story = {
  args: { variant: "tile" },
  parameters: { width: 206 },
};
