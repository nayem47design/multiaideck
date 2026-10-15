import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PictureResult } from "./PictureResult";

const meta = {
  title: "Organisms/Picture result",
  component: PictureResult,
  parameters: {
    docs: {
      description: {
        component:
          "Figma: Prototype › Image studio · Picture ready (166:28077); M22 · Picture ready below 768px.",
      },
    },
  },
  args: {
    title: "Golpo Coffee sign",
    back: { label: "Back", link: <a href="#" /> },
    tone: "warm",
    caption: "Golpo Coffee",
    labels: {
      status: "Your picture is ready",
      prompt:
        "“A cosy coffee shop sign that says Golpo Coffee, warm colours” · Drawing",
      cost: "40 credits (৳0.40)",
      mobileCost: "40 credits (৳0.40) · made by an image AI",
    },
    download: { label: "Download", mobileLabel: "Save to phone" },
    share: { label: "Share" },
    another: { label: "Make another version" },
    useInChat: { label: "Use in a chat" },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 860, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PictureResult>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};
export const Pending: Story = {
  args: {
    pending: true,
    labels: {
      status: "Making your picture…",
      prompt:
        "“A cosy coffee shop sign that says Golpo Coffee, warm colours” · Drawing",
      cost: "40 credits (৳0.40)",
      mobileCost: "40 credits (৳0.40) · made by an image AI",
    },
  },
};
export const Mobile: Story = { globals: { viewport: { value: "mobile1" } } };
export const Dark: Story = { globals: { theme: "dark" } };
