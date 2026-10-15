import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { IdentityCard } from "./IdentityCard";

// Figma's Identity card frame is 420px wide and shows the display name focused.
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
  title: "Organisms/Identity card",
  component: IdentityCard,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Identity card (103:29216).",
      },
    },
    pseudo: { focus: ["input"] },
  },
  args: {
    title: "Identity",
    initials: "AH",
    name: "Al Imam Hossain",
    changePhoto: { label: "Change photo" },
    photoHint: "JPG or PNG, up to 2 MB",
    displayName: {
      label: "Display name",
      value: "Al Imam Hossain",
      onValueChange: () => {},
      help: "Shown on shared chats and team reports.",
    },
    email: {
      label: "Email",
      value: "alhossain@musemind.agency",
      verifiedLabel: "Verified",
      change: { label: "Change" },
      help: "Used for sign-in and receipts.",
    },
  },
  decorators: [frame(420)],
} satisfies Meta<typeof IdentityCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
