import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MobileComposer } from "./MobileComposer";

const meta = {
  title: "Organisms/Mobile composer",
  component: MobileComposer,
  parameters: {
    docs: {
      description: {
        component:
          "Not a Figma component yet: “Mobile composer” on the M-screens (M2, M5, M6, M18, M19).",
      },
    },
  },
  args: {
    value: "",
    onValueChange: () => {},
    placeholder: "Ask anything, in English or Bangla…",
    "aria-label": "Message",
    modeLabel: "Best answer",
    labels: {
      add: "Add photos & files",
      mode: "Answer mode",
      voice: "Voice",
      send: "Send",
      removeFile: (name: string) => `Remove ${name}`,
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 336 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MobileComposer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** M2 · Home. */
export const Default: Story = {};
/** M6 · Compare. */
export const Compare: Story = {
  args: { modeLabel: "Compare", placeholder: "Ask all 3 a follow-up…" },
};
/** M18 · Voice: check your words. */
export const FromVoice: Story = {
  args: {
    value:
      "Give me coffee shop names that feel local to Dhaka, maybe with a Bangla word",
    voiceNote: "From your voice. Check the words, then tap Send.",
  },
};
/** M19 · File attached. */
export const FileAttached: Story = {
  args: {
    placeholder: "Ask about this file…",
    files: [
      {
        id: "1",
        name: "Menu-draft.pdf",
        kind: "file",
        meta: "PDF · 1.2 MB · ready",
      },
    ],
  },
};
