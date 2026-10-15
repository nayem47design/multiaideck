import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ModelListRow } from "./ModelListRow";

// Figma's Model list row frames are 760px wide.
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
  title: "Molecules/Model list row",
  component: ModelListRow,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Model list row (103:20733).",
      },
    },
  },
  args: {
    model: "gpt",
    name: "GPT-5",
    provider: "OpenAI",
    selected: false,
    onSelectedChange: () => {},
    versions: [
      { value: "flash", label: "3 Flash Preview" },
      { value: "pro", label: "3 Pro" },
    ],
    version: "flash",
    onVersionChange: () => {},
    versionLabel: "GPT-5 version",
    tags: ["Balanced", "All-round"],
    cost: "~6 cr",
  },
  decorators: [frame(760)],
} satisfies Meta<typeof ModelListRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Selected: Story = { args: { selected: true } };
export const Default: Story = {};
