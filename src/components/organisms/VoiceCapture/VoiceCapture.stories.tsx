import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { VoiceCapture } from "./VoiceCapture";

const meta = {
  title: "Organisms/Voice capture",
  component: VoiceCapture,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Not a Figma component yet: M4 · Voice: listening.",
      },
    },
  },
  args: {
    open: true,
    onOpenChange: () => {},
    title: "Listening…",
    transcript:
      "Give me coffee shop names that feel local to Dhaka, maybe with a Bangla word",
    levels: [10, 18, 30, 44, 26, 14, 34, 48, 22, 12, 28, 40, 18, 10, 6].map(
      (h) => h / 48,
    ),
    language: "English",
    labels: {
      close: "Close",
      language: "Voice language",
      cancel: "Cancel",
      done: "Done",
      pause: "Pause",
      hint: "Speak naturally. Tap Done, check the words, then send.",
    },
  },
} satisfies Meta<typeof VoiceCapture>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Listening: Story = {};
export const Paused: Story = { args: { paused: true } };
