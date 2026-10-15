import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { MobilePackList } from "./MobilePackList";

const meta = {
  title: "Organisms/Mobile pack list",
  component: MobilePackList,
  parameters: {
    docs: {
      description: {
        component:
          "Figma: Prototype › M11 · Add credits: amount & bKash › Pack · ৳…",
      },
    },
  },
  args: {
    label: "1. How much?",
    value: "699",
    onValueChange: () => {},
    packs: [
      { value: "99", price: "৳99", credits: "9,900 credits" },
      {
        value: "399",
        price: "৳399",
        credits: "41,895 credits",
        bonus: "+5% bonus",
      },
      {
        value: "699",
        price: "৳699",
        credits: "76,890 credits",
        bonus: "+10% bonus",
        tag: "Most chosen",
      },
      {
        value: "1299",
        price: "৳1,299",
        credits: "149,385 credits",
        bonus: "+15% bonus",
      },
    ],
  },
  decorators: [
    (Story) => (
      <div style={{ width: 328 }}>
        <Story />
      </div>
    ),
  ],
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <MobilePackList {...args} value={value} onValueChange={setValue} />;
  },
} satisfies Meta<typeof MobilePackList>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const NoneSelected: Story = { args: { value: "" } };
