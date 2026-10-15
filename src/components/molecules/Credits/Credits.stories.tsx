import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { Credits } from "./Credits";

// Figma's Credits is 244px wide.
function Frame(Story: () => React.JSX.Element) {
  return (
    <div style={{ width: 244 }}>
      <Story />
    </div>
  );
}

const meta = {
  title: "Molecules/Credits",
  component: Credits,
  parameters: {
    docs: {
      description: {
        component:
          "Figma: Design system › Credits (245:28812): State=Collapsed (bar) / Expanded (card). The chevron folds and unfolds it.",
      },
    },
  },
  args: {
    expandLabel: "Show credits",
    collapseLabel: "Hide credits",
    balance: "10,684 credits",
    money: "≈ BDT 106.84",
    progress: 52.7,
    progressLabel: "Credits left",
    topUp: { label: "Top up" },
    goPro: { label: "Go Pro", link: <a href="#" /> },
  },
  decorators: [Frame],
} satisfies Meta<typeof Credits>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {};
export const Expanded: Story = { args: { state: "expanded" } };

/** Click the chevron to fold and unfold. */
export const Interactive: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(false);
    return (
      <Credits
        {...args}
        state={open ? "expanded" : "collapsed"}
        onToggle={() => setOpen((o) => !o)}
      />
    );
  },
};
