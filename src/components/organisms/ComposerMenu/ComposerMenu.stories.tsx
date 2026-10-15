import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { IconButton } from "@/components/atoms/IconButton";

import { ComposerMenu, ComposerMenuPanel } from "./ComposerMenu";

const ITEMS = [
  {
    icon: "file-02" as const,
    title: "Add photos & files",
    description: "PDF, Word, Excel, images · up to 20 MB",
  },
];

const meta = {
  title: "Organisms/Composer menu",
  component: ComposerMenuPanel,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Composer menu (147:38907).",
      },
    },
  },
  args: { items: ITEMS },
} satisfies Meta<typeof ComposerMenuPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The open menu, as in Figma. */
export const Default: Story = {};

/** Opened from the Composer's "+" button. */
export const OnTrigger: Story = {
  render: () => (
    <div className="pt-24">
      <ComposerMenu
        items={ITEMS.map((i) => ({ ...i, onSelect: () => {} }))}
        open
      >
        <IconButton
          variant="outline"
          icon="add-01"
          label="Add photos & files"
        />
      </ComposerMenu>
    </div>
  ),
};
