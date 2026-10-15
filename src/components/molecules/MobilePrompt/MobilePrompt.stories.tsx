import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MobilePrompt } from "./MobilePrompt";

const meta = {
  title: "Molecules/Mobile prompt",
  component: MobilePrompt,
  parameters: {
    docs: {
      description: {
        component:
          "Not a Figma component yet: “You” (M5, M20) and “You asked:” (M6, M8).",
      },
    },
  },
  args: { prompt: "Give me 3 name ideas for a small coffee shop in Dhaka" },
  decorators: [
    (Story) => (
      <div style={{ width: 328 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MobilePrompt>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Bubble: Story = {};
export const Line: Story = { args: { variant: "line", label: "You asked:" } };
