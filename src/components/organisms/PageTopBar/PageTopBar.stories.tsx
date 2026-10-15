import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PageTopBar } from "./PageTopBar";

// Figma's Page top bar frame is 1416px wide.
function frame(width: number, height?: number) {
  return function Frame(Story: () => React.JSX.Element) {
    return (
      <div style={{ width, height }}>
        <Story />
      </div>
    );
  };
}

const meta = {
  title: "Organisms/Page top bar",
  component: PageTopBar,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Page top bar (28:8647).",
      },
    },
  },
  args: {
    title: "Wallet",
    back: {
      label: "Back to chat",
      icon: "arrow-left-02",
      link: <a href="#" />,
    },
    action: { label: "Settings", icon: "settings-01", link: <a href="#" /> },
  },
  decorators: [frame(1416)],
} satisfies Meta<typeof PageTopBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
