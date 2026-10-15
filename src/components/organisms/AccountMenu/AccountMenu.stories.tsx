import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AccountMenu } from "./AccountMenu";

const items = [
  {
    id: "settings",
    icon: "settings-01",
    label: "Settings",
    trailing: "⌘,",
    link: <a href="#" />,
  },
  {
    id: "usage",
    icon: "chart-histogram",
    label: "Usage & billing",
    link: <a href="#" />,
  },
  {
    id: "language",
    icon: "globe-02",
    label: "Language",
    trailing: "English",
    submenu: true,
    link: <a href="#" />,
  },
  {
    id: "help",
    icon: "help-circle",
    label: "Help & support",
    link: <a href="#" />,
  },
  {
    id: "sign-out",
    icon: "logout-03",
    label: "Sign out",
    tone: "danger",
    separatorBefore: true,
  },
] as const;

const meta = {
  title: "Organisms/Account menu",
  component: AccountMenu,
  parameters: {
    docs: {
      description: {
        component:
          "Figma: Design system › Account menu (245:28819), opened from the sidebar's account row (Overlay · Account menu). Keyboard: arrows move, Enter picks, Esc closes.",
      },
    },
  },
  args: {
    label: "Account menu",
    items: items.map((i) => ({ ...i })),
    children: <button type="button">Open account menu</button>,
  },
} satisfies Meta<typeof AccountMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Figma: the open menu, rendered in place at the top-left (the trigger is hidden under it). */
export const Default: Story = {
  args: {
    open: true,
    portal: false,
    side: "bottom",
    sideOffset: 0,
    alignOffset: 0,
    children: (
      <button
        type="button"
        aria-label="Account menu"
        style={{ position: "absolute", top: 0, left: 0, width: 0, height: 0 }}
      />
    ),
  },
};

/** Click the button to open the menu above it, as in the sidebar. */
export const Interactive: Story = {
  decorators: [
    (Story) => (
      <div style={{ paddingTop: 240 }}>
        <Story />
      </div>
    ),
  ],
};
