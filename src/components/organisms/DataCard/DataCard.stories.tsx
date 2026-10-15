import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "@/components/atoms/Button";

import { DataCard } from "./DataCard";

// Shown at 760px: Figma's 287px component frame is too narrow for its rows.
function frame(width: number, height?: number) {
  return function Frame(Story: () => React.JSX.Element) {
    return (
      <div style={{ width, height }}>
        <Story />
      </div>
    );
  };
}

const meta = {
  title: "Organisms/Data card",
  component: DataCard,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Data card (103:29293).",
      },
    },
  },
  args: {
    title: "Your data",
    rows: [
      {
        icon: "bubble-chat",
        title: "Chat history",
        help: "Kept in your account until you delete it. Delete any chat from its menu.",
        action: (
          <Button
            variant="secondary"
            size="sm"
            icon="link-square-02"
            iconSize="sm"
          >
            Privacy policy
          </Button>
        ),
      },
      {
        icon: "download-01",
        title: "Download your data",
        help: "Profile and preferences as a file. Full chat export is coming later.",
        action: (
          <Button
            variant="secondary"
            size="sm"
            icon="download-01"
            iconSize="sm"
          >
            Download
          </Button>
        ),
      },
    ],
  },
  decorators: [frame(760)],
} satisfies Meta<typeof DataCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
