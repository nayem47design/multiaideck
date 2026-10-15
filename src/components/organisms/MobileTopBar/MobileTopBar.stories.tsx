import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MobileTopBar } from "./MobileTopBar";

const meta = {
  title: "Organisms/Mobile top bar",
  component: MobileTopBar,
  parameters: {
    docs: {
      description: {
        component:
          "Figma: Prototype › M5 · Best answer › Top bar (166:21516); root screens as M14 · Chats.",
      },
    },
  },
  args: { title: "Coffee shop names" },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MobileTopBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Chat: Story = {
  args: {
    back: { label: "Back", link: <a href="#" /> },
    actions: [
      { icon: "share-01", label: "Share" },
      { icon: "more-horizontal", label: "More" },
    ],
  },
};
export const Root: Story = { args: { title: "Chats" } };
