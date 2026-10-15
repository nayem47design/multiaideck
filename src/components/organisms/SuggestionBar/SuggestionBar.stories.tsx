import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SuggestionBar } from "./SuggestionBar";

const meta = {
  title: "Organisms/Suggestion bar",
  component: SuggestionBar,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Suggestion bar (28:8632).",
      },
    },
  },
  args: {
    models: ["gpt", "gemini", "claude"],
    title: "3 answers ready.",
    message: "MultiAI suggests Claude: most complete, mid cost.",
    whyLabel: "Why?",
  },
} satisfies Meta<typeof SuggestionBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
