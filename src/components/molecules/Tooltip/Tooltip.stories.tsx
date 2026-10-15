import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Icon } from "@/components/atoms/Icon";

import { CostEstimate } from "../CostEstimate";
import { Tooltip, TooltipBox } from "./Tooltip";

const BODY = "GPT ~2 to 5 cr, Claude ~3 to 6 cr, Gemini ~1 to 3 cr.";

const meta = {
  title: "Molecules/Tooltip",
  component: TooltipBox,
  parameters: {
    docs: {
      description: { component: "Figma: Design system › Tooltip (103:20633)." },
    },
  },
  args: { title: "Estimate", body: BODY },
} satisfies Meta<typeof TooltipBox>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The tooltip box on its own, as in Figma. */
export const Default: Story = {};

/** On hover or focus of its trigger. */
export const OnTrigger: Story = {
  render: (args) => (
    <div className="p-16">
      <Tooltip {...args} open>
        <button type="button">
          <CostEstimate>≈ 2 to 4 cr</CostEstimate>
        </button>
      </Tooltip>
    </div>
  ),
};

/** Size=Label: one line for icon-only controls (the collapsed sidebar). */
export const Label: Story = {
  args: { size: "label", title: undefined, body: "New chat", shortcut: "⌘N" },
};

/** Size=Label beside its trigger, as on "Home · Sidebar collapsed". */
export const LabelOnTrigger: Story = {
  args: { size: "label", title: undefined, body: "New chat", shortcut: "⌘N" },
  render: (args) => (
    <div className="p-16">
      <Tooltip {...args} side="right" open>
        <button
          type="button"
          aria-label="New chat"
          className="flex size-rail-tile items-center justify-center rounded-pill bg-surface"
        >
          <Icon name="pencil-edit-02" className="size-icon-sm" />
        </button>
      </Tooltip>
    </div>
  ),
};
