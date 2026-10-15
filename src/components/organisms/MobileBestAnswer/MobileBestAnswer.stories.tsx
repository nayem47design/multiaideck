import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MobileBestAnswer } from "./MobileBestAnswer";

const meta = {
  title: "Organisms/Mobile best answer",
  component: MobileBestAnswer,
  parameters: {
    docs: {
      description: {
        component: "Not a Figma component yet: the answer on M5 · Best answer.",
      },
    },
  },
  args: {
    models: ["gpt", "claude", "gemini"],
    title: "Best answer",
    subtitle: "from 3 AIs",
    intro: "Here are the strongest ideas from all three:",
    ideas: [
      {
        name: "Golpo Coffee",
        model: "claude",
        source: "from Claude",
        text: "“Golpo” means story: a place to sit and talk.",
      },
      {
        name: "Bean Bari",
        model: "gemini",
        source: "from Gemini",
        text: "“Bari” means home: warm and local.",
      },
      {
        name: "Cha & Crema",
        model: "gpt",
        source: "from GPT-5",
        text: "Dhaka’s tea culture meets espresso.",
      },
    ],
    cost: "2.8 credits",
    money: "(৳0.03)",
    labels: {
      copy: "Copy",
      share: "Share",
      helpful: "Helpful",
      notHelpful: "Not helpful",
      seeAll: "See all 3 answers",
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 328 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MobileBestAnswer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
