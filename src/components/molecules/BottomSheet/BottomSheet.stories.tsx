import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "@/components/atoms/Button";

import { BottomSheet } from "./BottomSheet";

const meta = {
  title: "Molecules/Bottom sheet",
  component: BottomSheet,
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "mobile1" },
    docs: {
      description: {
        component:
          "Not a Figma component yet: the mobile sheet on M3, M7, M9 and M25 (scrim, 28px top corners, grabber, heading).",
      },
    },
  },
  args: {
    open: true,
    onOpenChange: () => {},
    title: "Add to your question",
    description: "The AIs can read photos, PDFs, Word and Excel files.",
    children: (
      <Button variant="secondary" className="w-full">
        Cancel
      </Button>
    ),
  },
} satisfies Meta<typeof BottomSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};
export const WithAside: Story = {
  args: {
    title: "Choose up to 3 AIs",
    titleAside: <span className="type-chat-m-strong text-blue">3 of 3</span>,
    description: "Each AI answers your question on its own.",
  },
};
