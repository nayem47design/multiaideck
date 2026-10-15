import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SaveBar } from "./SaveBar";

// Figma's Save bar frame is 560px wide.
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
  title: "Molecules/Save bar",
  component: SaveBar,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Save bar (103:29082).",
      },
    },
  },
  args: {
    message: "You changed your display name",
    saveLabel: "Save changes",
    discardLabel: "Discard",
    onSave: () => {},
    onDiscard: () => {},
  },
  decorators: [frame(560)],
} satisfies Meta<typeof SaveBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const StateSaving: Story = {
  name: "State · Saving",
  args: { saving: true },
};
