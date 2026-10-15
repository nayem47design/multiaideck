import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { NavItem } from "./NavItem";

// Figma's Nav item frames are 244px wide.
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
  title: "Molecules/Nav item",
  component: NavItem,
  parameters: {
    docs: {
      description: { component: "Figma: Design system › Nav item (28:8334)." },
    },
  },
  args: { icon: "bubble-chat", children: "Chats", href: "#" },
  decorators: [frame(244)],
} satisfies Meta<typeof NavItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultNone: Story = { name: "Default · None" };
export const SelectedNone: Story = {
  name: "Selected · None",
  args: { selected: true },
};
export const DefaultExternal: Story = {
  name: "Default · External",
  args: { external: true },
};
export const SelectedExternal: Story = {
  name: "Selected · External",
  args: { selected: true, external: true },
};
export const StateHover: Story = {
  name: "State · Hover",
  parameters: { pseudo: { hover: true } },
};
export const StateFocus: Story = {
  name: "State · Focus",
  parameters: { pseudo: { focusVisible: true } },
};
