import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Composer } from "./Composer";

// Figma's Composer frames are 880px wide.
function frame(width: number, height?: number) {
  return function Frame(Story: () => React.JSX.Element) {
    return (
      <div style={{ width, height }}>
        <Story />
      </div>
    );
  };
}

const LEVELS = [
  6, 10, 16, 22, 14, 8, 18, 24, 12, 6, 10, 20, 26, 16, 8, 12, 18, 10, 0, 0, 0,
  0,
].map((h) => h / 26);

const meta = {
  title: "Organisms/Composer",
  component: Composer,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Composer (147:39061).",
      },
    },
  },
  args: {
    value: "",
    onValueChange: () => {},
    placeholder: "Ask a follow-up to all 3 models…",
    "aria-label": "Message",
    modes: [
      { value: "best", label: "Best answer" },
      { value: "compare", label: "Compare" },
    ],
    mode: "compare",
    onModeChange: () => {},
    models: ["gpt", "claude", "gemini"],
    estimate: "≈ 2 to 4 cr",
    labels: {
      attach: "Add photos & files",
      voice: "Voice",
      send: "Send",
      cancelVoice: "Cancel voice",
      doneVoice: "Done",
      models: "3 models",
      modeGroup: "Answer mode",
      removeAttachment: (name: string) => `Remove ${name}`,
      language: "Voice language",
    },
  },
  decorators: [frame(880)],
} satisfies Meta<typeof Composer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const VoiceListening: Story = {
  args: {
    state: "voice-listening",
    voice: {
      transcript: "Give me coffee shop names that feel local to Dhaka",
      status: "Listening",
      elapsed: "0:07",
      language: "English",
      levels: LEVELS,
    },
  },
};
export const Attachment: Story = {
  args: {
    placeholder: "Ask about these files…",
    attachments: [
      { id: "1", name: "Menu-draft.pdf", kind: "file", meta: "PDF · 1.2 MB" },
      {
        id: "2",
        name: "storefront.jpg",
        kind: "image",
        meta: "Uploading · 64%",
        progress: 64,
      },
    ],
  },
};
