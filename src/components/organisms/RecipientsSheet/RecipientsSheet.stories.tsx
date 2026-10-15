import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RecipientsSheet } from "./RecipientsSheet";

const meta = {
  title: "Organisms/Recipients sheet",
  component: RecipientsSheet,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Not a Figma component yet: M9 · Follow-up: who should get it?",
      },
    },
  },
  args: {
    open: true,
    onOpenChange: () => {},
    title: "Not every AI answered last time",
    description: "Who should get “Add a Bangla tagline to each”?",
    choices: [
      {
        value: "all",
        models: ["gpt", "claude", "gemini"],
        title: "All 3 AIs",
        description:
          "Any AI that missed first gets your earlier questions, so it understands.",
        cost: "About 3 credits (৳0.03)",
      },
      {
        value: "claude",
        models: ["claude"],
        title: "Only Claude",
        description: "The one that answered. Cheaper and faster.",
        cost: "About 1.3 credits (৳0.01)",
      },
    ],
    value: "all",
    onValueChange: () => {},
    note: "Each AI answers on its own. They never see each other’s answers.",
    sendLabel: "Send",
  },
} satisfies Meta<typeof RecipientsSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllSelected: Story = {};
export const OnlyClaude: Story = { args: { value: "claude" } };
