import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ScreenDialog } from "./ScreenDialog";

const meta = {
  title: "Organisms/Screen dialog",
  component: ScreenDialog,
  parameters: {
    docs: {
      description: {
        component:
          "Centred dialog on desktop, full screen below 768px (Overlay · Go Pro / M37 · Go Pro). Resize the canvas to see both.",
      },
    },
  },
  args: {
    open: true,
    onOpenChange: () => {},
    label: "Example",
    desktop: (
      <div className="rounded-xl bg-surface p-8 type-body text-ink shadow-dialog">
        Desktop dialog
      </div>
    ),
    mobile: <div className="p-4 type-body text-ink">Mobile full screen</div>,
  },
} satisfies Meta<typeof ScreenDialog>;

export default meta;
export const Default: StoryObj<typeof meta> = {};
