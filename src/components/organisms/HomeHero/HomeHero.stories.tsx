import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { HomeHero } from "./HomeHero";

function frame(width: number) {
  return function Frame(Story: () => React.JSX.Element) {
    return (
      <div style={{ width }}>
        <Story />
      </div>
    );
  };
}

const meta = {
  title: "Organisms/Home hero",
  component: HomeHero,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Home hero (103:29181).",
      },
    },
  },
  args: {
    greeting: "Good evening, Imam",
    subtitle: "Ask once. Get the best answer from up to three models.",
    composer: {
      value: "",
      onValueChange: () => {},
      placeholder: "Ask anything, in English or Bangla…",
      "aria-label": "Message",
      modes: [
        { value: "best", label: "Best answer" },
        { value: "compare", label: "Compare" },
      ],
      mode: "best",
      onModeChange: () => {},
      models: ["gpt", "claude", "gemini"],
      estimate: "≈ 6 to 14 cr",
      labels: {
        attach: "Add photos & files",
        voice: "Voice",
        send: "Send",
        cancelVoice: "Cancel voice",
        doneVoice: "Done",
        models: "GPT, Claude, Gemini",
        modeGroup: "Answer mode",
        removeAttachment: (name: string) => `Remove ${name}`,
        language: "Voice language",
      },
    },
    modeExplainer:
      "Best answer asks 3 models in parallel and merges the strongest reply. You pay only for tokens used.",
    starters: [
      {
        icon: "layers-01",
        title: "Compare three models",
        description: "See GPT, Claude and Gemini by side",
      },
      {
        icon: "globe-02",
        title: "Write in Bangla",
        description: "Draft, translate or polish বাংলা text",
      },
      {
        icon: "image-01",
        title: "Create an image",
        description: "Open Image studio with a prompt",
      },
    ],
  },
  decorators: [frame(800)],
} satisfies Meta<typeof HomeHero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The lighter starter row the app uses (not yet in Figma). */
export const StarterPills: Story = { args: { startersLayout: "pills" } };
