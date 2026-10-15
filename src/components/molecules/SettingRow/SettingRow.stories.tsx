import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Toggle } from "@/components/atoms/Toggle";

import { SettingRow } from "./SettingRow";

// Figma's Setting row frame is 460px wide.
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
  title: "Molecules/Setting row",
  component: SettingRow,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Setting row (28:8364).",
      },
    },
  },
  args: {
    title: "Low balance alert",
    help: "When your balance drops below your limit.",
    children: <Toggle defaultChecked aria-label="Low balance alert" />,
  },
  decorators: [frame(460)],
} satisfies Meta<typeof SettingRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
