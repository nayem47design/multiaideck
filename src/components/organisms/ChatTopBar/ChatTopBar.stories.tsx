import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ChatTopBar } from "./ChatTopBar";

const meta = {
  title: "Organisms/Chat top bar",
  component: ChatTopBar,
  parameters: {
    docs: {
      description: {
        component:
          "Not a Figma component yet: Chat title pill + Share + more, on the desktop chat screens (Best answer, Compare).",
      },
    },
  },
  args: {
    title: "Coffee shop names",
    shareLabel: "Share",
    moreLabel: "More",
  },
  decorators: [
    (Story) => (
      <div style={{ width: 1112 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatTopBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
