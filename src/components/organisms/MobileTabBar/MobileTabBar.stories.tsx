import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MobileTabBar } from "./MobileTabBar";

const tabs = (selected: string) =>
  (
    [
      ["ai-magic", "Ask"],
      ["bubble-chat", "Chats"],
      ["wallet-01", "Wallet"],
      ["user", "Account"],
    ] as const
  ).map(([icon, label]) => ({
    icon,
    label,
    link: <a href="#" />,
    selected: label === selected,
  }));

const meta = {
  title: "Organisms/Mobile tab bar",
  component: MobileTabBar,
  parameters: {
    docs: {
      description: {
        component: "Figma: Prototype › M2 · Home › Tab bar (166:21142).",
      },
    },
  },
  args: { label: "Main", tabs: tabs("Ask") },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MobileTabBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ask: Story = {};
export const Chats: Story = { args: { tabs: tabs("Chats") } };
export const Wallet: Story = { args: { tabs: tabs("Wallet") } };
export const Account: Story = { args: { tabs: tabs("Account") } };
