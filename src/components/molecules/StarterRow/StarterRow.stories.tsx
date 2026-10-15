import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StarterRow } from "./StarterRow";

const meta = {
  title: "Molecules/Starter row",
  component: StarterRow,
  parameters: {
    docs: {
      description: {
        component: "Not a Figma component yet: “Starter · …” on M2 · Home.",
      },
    },
  },
  args: {
    icon: "globe-02",
    title: "Write in Bangla",
    description: "বাংলা লেখা, অনুবাদ",
  },
  decorators: [
    (Story) => (
      <div style={{ width: 328 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StarterRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Compare: Story = {
  args: {
    icon: "layers-01",
    title: "Compare 3 AI answers",
    description: "See them side by side",
  },
};
