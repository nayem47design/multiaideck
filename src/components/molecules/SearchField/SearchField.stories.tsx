import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SearchField } from "./SearchField";

// Figma's Search field frame is 300px wide.
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
  title: "Molecules/Search field",
  component: SearchField,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Search field (28:8313).",
      },
    },
  },
  args: {
    placeholder: "Search chats",
    shortcut: "⌘K",
    "aria-label": "Search chats",
  },
  decorators: [frame(300)],
} satisfies Meta<typeof SearchField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const StateFocus: Story = {
  name: "State · Focus",
  parameters: { pseudo: { focusWithin: true } },
};
