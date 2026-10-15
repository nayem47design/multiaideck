import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ModelOrb } from "@/components/atoms/ModelOrb";

import { ChoiceCard, ChoiceGroup } from "./ChoiceCard";

const meta = {
  title: "Molecules/Choice card",
  component: ChoiceCard,
  parameters: {
    docs: {
      description: {
        component:
          "Not a Figma component yet: radio cards in mobile sheets (M7 “Mode · …”, M9 “Choice · …”).",
      },
    },
  },
  args: {
    value: "best",
    title: "Best answer",
    tag: "Recommended",
    description:
      "One reply, built from the best parts of 3 AIs. Easiest to read.",
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <ChoiceGroup value="best" onValueChange={() => {}} label="Mode">
          <Story />
        </ChoiceGroup>
      </div>
    ),
  ],
} satisfies Meta<typeof ChoiceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Selected: Story = {};
export const Unselected: Story = {
  args: {
    value: "compare",
    title: "Compare",
    tag: undefined,
    description: "See each AI’s answer on its own and pick the one you like.",
  },
};
export const WithOrbAndCost: Story = {
  args: {
    value: "best",
    title: "Only Claude",
    tag: undefined,
    description: "The one that answered. Cheaper and faster.",
    footnote: "About 1.3 credits (৳0.01)",
    leading: <ModelOrb model="claude" size="md" />,
  },
};
