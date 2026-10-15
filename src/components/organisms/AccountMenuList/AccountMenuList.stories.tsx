import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AccountMenuList } from "./AccountMenuList";

const meta = {
  title: "Organisms/Account menu list",
  component: AccountMenuList,
  parameters: {
    docs: {
      description: {
        component:
          "Figma: Prototype › M15 · Account & settings › Settings list; M41 › Rows, Danger.",
      },
    },
  },
  args: {
    items: [
      {
        id: "language",
        icon: "globe-02",
        label: "Language",
        value: "English",
        onClick: () => {},
        "aria-haspopup": "dialog",
      },
      {
        id: "usage",
        icon: "chart-histogram",
        label: "Usage",
        value: "26 credits this month",
        link: <a href="#" />,
      },
      {
        id: "notifications",
        icon: "notification-01",
        label: "Notifications",
        link: <a href="#" />,
      },
      {
        id: "privacy",
        icon: "shield-01",
        label: "Privacy & security",
        link: <a href="#" />,
      },
      {
        id: "help",
        icon: "help-circle",
        label: "Help & support",
        value: "Chat or call",
        link: <a href="#" />,
      },
    ],
  },
  decorators: [
    (Story) => (
      <div style={{ width: 328 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AccountMenuList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Danger: Story = {
  args: {
    items: [
      {
        id: "delete",
        icon: "delete-02",
        label: "Delete account",
        tone: "danger",
        onClick: () => {},
      },
    ],
  },
};
