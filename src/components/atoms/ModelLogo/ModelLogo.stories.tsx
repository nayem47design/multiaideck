import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { ModelId } from "@/lib/ai/models";

import { ModelLogo } from "./ModelLogo";

// The Figma component set's order.
const ORDER: ModelId[] = [
  "gpt",
  "o3",
  "claude",
  "gemini",
  "deepseek",
  "grok",
  "perplexity",
  "llama",
  "qwen",
];

const meta = {
  title: "Atoms/Model logo",
  component: ModelLogo,
  parameters: {
    docs: {
      description: {
        component:
          "Figma: Design system › Model logo. Provider logos from @lobehub/icons-static-svg (MIT); trademarks of their owners.",
      },
    },
  },
  args: { model: "claude", tone: "brand" },
} satisfies Meta<typeof ModelLogo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Brand: Story = {};
export const Mono: Story = { args: { tone: "mono" } };

/** Every model, Brand row then Mono row, as the Figma component set (16px padding and gaps). */
export const All: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4 text-ink">
      {(["brand", "mono"] as const).map((tone) => (
        <div key={tone} className="flex gap-4">
          {ORDER.map((m) => (
            <ModelLogo key={m} model={m} tone={tone} />
          ))}
        </div>
      ))}
    </div>
  ),
};
