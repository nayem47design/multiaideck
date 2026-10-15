import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SidebarSectionHeader } from "./SidebarSectionHeader";

// Figma's Sidebar section header is 244px wide.
function Frame(Story: () => React.JSX.Element) {
  return (
    <div style={{ width: 244 }}>
      <Story />
    </div>
  );
}

const meta = {
  title: "Molecules/Sidebar section header",
  component: SidebarSectionHeader,
  parameters: {
    docs: {
      description: {
        component:
          "Figma: Design system › Sidebar section header (245:28609). The label and chevron fold the section; the optional action sits at the end.",
      },
    },
  },
  args: {
    label: "Projects",
    action: { label: "New project" },
  },
  decorators: [Frame],
} satisfies Meta<typeof SidebarSectionHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Figma default: "Projects" with the "＋" action. */
export const Default: Story = {};

/** Folded: the chevron points right and the section below is hidden. */
export const Folded: Story = { args: { expanded: false } };

/** A day section ("Today"), no action. */
export const NoAction: Story = {
  args: { label: "Today", action: undefined },
};
