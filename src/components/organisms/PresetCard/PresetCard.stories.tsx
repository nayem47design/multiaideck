import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PresetCard } from "./PresetCard";

const meta = {
  title: "Organisms/Preset card",
  component: PresetCard,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Figma: Prototype › Presets › Grid › Preset · Recommended.",
      },
    },
  },
  args: {
    name: "Recommended",
    description: "A good mix for everyday questions.",
    cost: "≈ 6–14 cr a question",
    models: ["gpt", "claude", "gemini"],
    inUseLabel: "In use",
    useLabel: "Use",
    editLabel: "Edit",
  },
  decorators: [
    (Story) => (
      <div style={{ width: 422 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PresetCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InUse: Story = {};
export const Default: Story = {
  args: {
    name: "Cheapest",
    description: "Lowest cost. Good for quick, simple questions.",
    cost: "≈ 2–4 cr a question",
    models: ["gemini", "deepseek", "grok"],
    inUseLabel: undefined,
  },
};
export const TwoModels: Story = {
  args: {
    name: "Careful writing",
    description: "Two AIs for emails, posts and letters.",
    cost: "≈ 5–10 cr a question",
    models: ["claude", "gpt"],
    inUseLabel: undefined,
  },
};
export const Dark: Story = { globals: { theme: "dark" } };
