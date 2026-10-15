import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LightField } from "./LightField";

// Shown inside a screen-sized canvas frame, as on the Figma Prototype page.
function frame(width: number, height: number) {
  return function Frame(Story: () => React.JSX.Element) {
    return (
      <div className="relative isolate bg-canvas" style={{ width, height }}>
        <Story />
      </div>
    );
  };
}

const meta = {
  title: "Atoms/Light field",
  component: LightField,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Figma: Prototype › Light field (Home, Best answer, Settings, Wallet, Sign in, M2).",
      },
    },
  },
  args: { responsive: false },
} satisfies Meta<typeof LightField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const App: Story = {
  args: { variant: "app" },
  decorators: [frame(1440, 900)],
};
export const Dimmed: Story = {
  args: { variant: "dimmed" },
  decorators: [frame(1440, 900)],
};
export const Page: Story = {
  args: { variant: "page" },
  decorators: [frame(1440, 900)],
};
export const Wallet: Story = {
  args: { variant: "wallet" },
  decorators: [frame(1440, 900)],
};
export const Auth: Story = {
  args: { variant: "auth" },
  decorators: [frame(1440, 900)],
};
export const Mobile: Story = {
  args: { variant: "mobile" },
  decorators: [frame(360, 800)],
};
