import type { Meta, StoryObj } from "@storybook/nextjs-vite";

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
