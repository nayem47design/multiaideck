import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MODEL_IDS } from "@/lib/ai/models";

import { ModelOrb, type ModelOrbSize } from "./ModelOrb";

const SIZES: ModelOrbSize[] = ["lg", "md", "sm"];

const meta = {
  title: "Atoms/Model orb",
  component: ModelOrb,
  parameters: {
    docs: {
      description: { component: "Figma: Design system › Model orb (28:8269)." },
    },
  },
  args: { model: "gpt", size: "lg" },
  argTypes: {
    model: { control: "inline-radio", options: MODEL_IDS },
    size: { control: "inline-radio", options: SIZES },
  },
} satisfies Meta<typeof ModelOrb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Orb: Story = {};

export const All: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-4">
      {SIZES.map((size) => (
        <div key={size} className="flex items-center gap-4">
          {MODEL_IDS.map((model) => (
            <ModelOrb key={model} model={model} size={size} />
          ))}
        </div>
      ))}
    </div>
  ),
};
