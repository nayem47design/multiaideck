import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Field } from "./Field";

// Figma's Field frame is 320px wide and shows its Input in the Focus state.
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
  title: "Molecules/Field",
  component: Field,
  parameters: {
    docs: {
      description: { component: "Figma: Design system › Field (28:8356)." },
    },
  },
  args: {
    label: "Display name",
    help: "Shown on shared chats.",
    defaultValue: "Al Imam Hossain",
  },
  decorators: [frame(320)],
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { parameters: { pseudo: { focus: ["input"] } } };
export const StateError: Story = {
  name: "State · Error",
  args: { error: "Use 2 to 40 characters." },
};
