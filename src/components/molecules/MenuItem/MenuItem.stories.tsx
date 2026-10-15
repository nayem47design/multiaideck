import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MenuItem } from "./MenuItem";

// Figma's Menu item is 220px wide.
function Frame(Story: () => React.JSX.Element) {
  return (
    <div style={{ width: 220 }}>
      <Story />
    </div>
  );
}

const meta = {
  title: "Molecules/Menu item",
  component: MenuItem,
  parameters: {
    docs: {
      description: {
        component:
          "Figma: Design system › Menu item (245:28774): Type=Default / Hover / Danger. Hover is also the keyboard-highlight look inside a menu.",
      },
    },
  },
  args: { icon: "settings-01", label: "Settings", trailing: "⌘," },
  decorators: [Frame],
} satisfies Meta<typeof MenuItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Hover: Story = { args: { type: "hover" } };
export const Danger: Story = { args: { type: "danger" } };
/** Language row: the current value and a submenu chevron. */
export const WithSubmenu: Story = {
  args: {
    icon: "globe-02",
    label: "Language",
    trailing: "English",
    submenu: true,
  },
};
