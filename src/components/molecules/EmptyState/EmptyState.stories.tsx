import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "@/components/atoms/Button";

import { EmptyState } from "./EmptyState";

// Figma's Empty state frame is 360px wide.
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
  title: "Molecules/Empty state",
  component: EmptyState,
  parameters: {
    docs: {
      description: {
        component:
          "Figma: Design system › Empty state (298:56067): Tone=Empty and Tone=Error.",
      },
    },
  },
  args: {
    title: "No chats yet",
    body: "Ask your first question. Try two models and see which you prefer.",
    action: (
      <Button variant="secondary" size="sm">
        Button
      </Button>
    ),
  },
  decorators: [frame(360)],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Error: Story = {
  args: {
    tone: "error",
    title: "Couldn’t load this",
    body: "Check your connection and try again.",
    action: (
      <Button variant="secondary" size="sm">
        Try again
      </Button>
    ),
  },
};
