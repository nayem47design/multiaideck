import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RadioGroup } from "@/components/atoms/Radio";

import { PackRow } from "./PackRow";

// Figma's Pack row frame is 640px wide and shows the selected row.
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
  title: "Molecules/Pack row",
  component: PackRow,
  parameters: {
    docs: {
      description: { component: "Figma: Design system › Pack row (28:8386)." },
    },
  },
  args: {
    value: "699",
    price: "BDT 699",
    credits: "76,890 credits",
    bonus: "+10%",
    usage: "2,960 chats",
  },
  decorators: [frame(640)],
  render: (args, { parameters }) => (
    <RadioGroup
      aria-label="Credit packs"
      defaultValue={parameters.unselected ? undefined : args.value}
    >
      <PackRow {...args} />
    </RadioGroup>
  ),
} satisfies Meta<typeof PackRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const StateUnselected: Story = {
  name: "State · Unselected",
  parameters: { unselected: true },
};
