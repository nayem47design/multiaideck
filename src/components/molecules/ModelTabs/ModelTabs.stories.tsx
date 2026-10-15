import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ModelTabs } from "./ModelTabs";

const meta = {
  title: "Molecules/Model tabs",
  component: ModelTabs,
  parameters: {
    docs: {
      description: {
        component:
          "Not a Figma component yet: “Model tabs” on mobile Compare (M6, M8, M23–M33).",
      },
    },
  },
  args: {
    label: "Answers",
    value: "claude",
    onValueChange: () => {},
    tabs: [
      {
        value: "claude",
        model: "claude",
        name: "Claude",
        caption: "Suggested",
        tone: "info",
      },
      { value: "gpt", model: "gpt", name: "GPT-5", caption: "0.9 cr" },
      {
        value: "gemini",
        model: "gemini",
        name: "Gemini",
        caption: "Cheapest",
        tone: "success",
      },
    ],
  },
  decorators: [
    (Story) => (
      <div style={{ width: 328 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ModelTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** M6. */
export const Suggested: Story = {};
/** M8: the selected AI didn’t answer. */
export const Failed: Story = {
  args: {
    value: "gpt",
    tabs: [
      { value: "claude", model: "claude", name: "Claude", caption: "Answered" },
      {
        value: "gpt",
        model: "gpt",
        name: "GPT-5",
        caption: "Didn’t answer",
        tone: "error",
      },
      {
        value: "gemini",
        model: "gemini",
        name: "Gemini",
        caption: "Didn’t answer",
        tone: "error",
      },
    ],
  },
};
