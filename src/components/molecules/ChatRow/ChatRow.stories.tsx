import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ChatRow } from "./ChatRow";

// Figma's Chat row is 244px wide.
function Frame(Story: () => React.JSX.Element) {
  return (
    <div style={{ width: 244 }}>
      <Story />
    </div>
  );
}

const meta = {
  title: "Molecules/Chat row",
  component: ChatRow,
  parameters: {
    docs: {
      description: {
        component:
          "Figma: Design system › Chat row (245:28743): State=Default / Active × Models=Three / One. Hover takes the active fill.",
      },
    },
  },
  args: {
    title: "Coffee shop names",
    cost: "2.6 cr",
    models: ["gpt", "claude", "gemini"],
    link: <a href="#" />,
  },
  decorators: [Frame],
} satisfies Meta<typeof ChatRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultThree: Story = { name: "Default · Three" };
export const ActiveThree: Story = {
  name: "Active · Three",
  args: { state: "active" },
};
export const DefaultOne: Story = {
  name: "Default · One",
  args: { models: ["gemini"] },
};
export const ActiveOne: Story = {
  name: "Active · One",
  args: { models: ["gemini"], state: "active" },
};
