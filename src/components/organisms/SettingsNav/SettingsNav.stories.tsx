import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SettingsNav } from "./SettingsNav";

const meta = {
  title: "Organisms/Settings nav",
  component: SettingsNav,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Settings nav (28:8735).",
      },
    },
  },
  args: {
    label: "Settings",
    groups: [
      [
        {
          icon: "user",
          label: "Profile",
          link: <a href="#" />,
          selected: true,
        },
        {
          icon: "sliders-horizontal",
          label: "Models & presets",
          link: <a href="#" />,
        },
        {
          icon: "notification-01",
          label: "Notifications",
          link: <a href="#" />,
        },
        {
          icon: "shield-01",
          label: "Privacy & security",
          link: <a href="#" />,
        },
        { icon: "chart-histogram", label: "Usage", link: <a href="#" /> },
      ],
      [
        {
          icon: "wallet-01",
          label: "Wallet & billing",
          link: <a href="#" />,
          external: true,
        },
        {
          icon: "help-circle",
          label: "Help & support",
          link: <a href="#" />,
          external: true,
        },
      ],
    ],
  },
} satisfies Meta<typeof SettingsNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
