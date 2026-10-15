import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ThinkingPanel, ThinkingStop, type ThinkingRow } from "./ThinkingPanel";

const ROWS: ThinkingRow[] = [
  {
    model: "gemini",
    name: "Gemini 3 Flash",
    status: "done",
    statusLabel: "Done in 0.9 s",
  },
  { model: "gpt", name: "GPT-5", status: "writing", statusLabel: "Writing…" },
  {
    model: "claude",
    name: "Claude Sonnet 4",
    status: "writing",
    statusLabel: "Writing…",
  },
];

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
  title: "Organisms/Thinking panel",
  component: ThinkingPanel,
  parameters: {
    docs: {
      description: {
        component:
          "Not a Figma component yet. Drawn on “Thinking · Best answer” (Thinking card) and M20 / M26 / M30.",
      },
    },
  },
  args: {
    title: "Asking 3 AIs…",
    body: "Usually 5 to 15 seconds. You can keep browsing; the answer will wait in this chat.",
    rows: ROWS,
    stopLabel: "Stop",
    stopNote: "If you stop, you only pay for answers that finished.",
  },
  decorators: [frame(760)],
} satisfies Meta<typeof ThinkingPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Desktop: Thinking · Best answer. */
export const Card: Story = {};

/** M20 · AIs are thinking. */
export const Mobile: Story = {
  decorators: [frame(328)],
  args: {
    layout: "mobile",
    body: "Usually 5 to 15 seconds. You can leave this screen; the answer will wait for you.",
    rows: [
      {
        model: "gemini",
        name: "Gemini",
        status: "done",
        statusLabel: "Done in 0.9 s",
      },
      {
        model: "gpt",
        name: "GPT-5",
        status: "writing",
        statusLabel: "Writing…",
      },
      {
        model: "claude",
        name: "Claude",
        status: "writing",
        statusLabel: "Writing…",
      },
    ],
  },
};

/** M26 · Follow-up: two AIs slow. */
export const MobileSlow: Story = {
  decorators: [frame(328)],
  args: {
    layout: "mobile",
    body: "Two AIs are slower than usual. We’ll stop waiting after 30 seconds, and you won’t pay for them.",
    rows: [
      {
        model: "claude",
        name: "Claude",
        status: "done",
        statusLabel: "Done in 2.3 s",
      },
      {
        model: "gpt",
        name: "GPT-5",
        status: "slow",
        statusLabel: "Taking longer…",
      },
      {
        model: "gemini",
        name: "Gemini",
        status: "unresponsive",
        statusLabel: "Not responding",
      },
    ],
  },
};

/** M30 · Prompt 3: catching up. */
export const MobileCatchingUp: Story = {
  decorators: [frame(328)],
  args: {
    layout: "mobile",
    body: "GPT-5 and Gemini first read your earlier questions, so their answers make sense.",
    rows: [
      {
        model: "claude",
        name: "Claude",
        status: "writing",
        statusLabel: "Writing…",
      },
      {
        model: "gpt",
        name: "GPT-5",
        status: "catching-up",
        statusLabel: "Catching up, then writing…",
      },
      {
        model: "gemini",
        name: "Gemini",
        status: "catching-up",
        statusLabel: "Catching up, then writing…",
      },
    ],
  },
};

/** The mobile Stop block at the bottom of M20. */
export const MobileStop: Story = {
  decorators: [frame(328)],
  render: () => (
    <ThinkingStop
      label="Stop"
      note="If you stop, you only pay for answers that finished."
    />
  ),
};
