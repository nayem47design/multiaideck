import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ModeSheet } from "./ModeSheet";

const meta = {
  title: "Organisms/Mode sheet",
  component: ModeSheet,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Not a Figma component yet: M7 · How should we answer?",
      },
    },
  },
  args: {
    open: true,
    onOpenChange: () => {},
    title: "How should we answer?",
    modes: [
      {
        value: "best",
        title: "Best answer",
        tag: "Recommended",
        description:
          "One reply, built from the best parts of 3 AIs. Easiest to read.",
      },
      {
        value: "compare",
        title: "Compare",
        description:
          "See each AI’s answer on its own and pick the one you like.",
      },
    ],
    mode: "best",
    onModeChange: () => {},
    presetsLabel: "Which AIs?",
    presets: [
      { value: "recommended", label: "Recommended" },
      { value: "cheapest", label: "Cheapest" },
      { value: "bangla", label: "Bangla" },
    ],
    preset: "recommended",
    onPresetChange: () => {},
    models: ["gpt", "claude", "gemini"],
    modelNames: "GPT-5, Claude, Gemini",
    cost: "About 6–14 credits (৳0.06–0.14) a question",
    changeLabel: "Change",
    doneLabel: "Done",
  },
} satisfies Meta<typeof ModeSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BestAnswer: Story = {};
export const Compare: Story = { args: { mode: "compare" } };
