import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProjectRow } from "./ProjectRow";

// Figma's Project row is 244px wide.
function Frame(Story: () => React.JSX.Element) {
  return (
    <div style={{ width: 244 }}>
      <Story />
    </div>
  );
}

const meta = {
  title: "Molecules/Project row",
  component: ProjectRow,
  parameters: {
    docs: {
      description: {
        component:
          "Figma: Design system › Project row (245:28699): State=Default / Active. Hover takes the active fill.",
      },
    },
  },
  args: { name: "MultiAI launch", count: "12", link: <a href="#" /> },
  decorators: [Frame],
} satisfies Meta<typeof ProjectRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Active: Story = { args: { state: "active" } };
/** A long name truncates before the count. */
export const LongName: Story = {
  args: { name: "Thesis research on rural microfinance in Sylhet" },
};
