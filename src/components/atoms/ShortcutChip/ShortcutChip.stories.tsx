import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ShortcutChip } from "./ShortcutChip";

const meta = {
  title: "Atoms/Shortcut chip",
  component: ShortcutChip,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Shortcut chip (103:20587).",
      },
    },
  },
  args: { children: "⌘K" },
} satisfies Meta<typeof ShortcutChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
