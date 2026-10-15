import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AttachSheet } from "./AttachSheet";

const meta = {
  title: "Organisms/Attach sheet",
  component: AttachSheet,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: { component: "Not a Figma component yet: M3 · “+” sheet." },
    },
  },
  args: {
    open: true,
    onOpenChange: () => {},
    onSelect: () => {},
    title: "Add to your question",
    description: "The AIs can read photos, PDFs, Word and Excel files.",
    cancelLabel: "Cancel",
    options: [
      {
        value: "camera",
        icon: "camera-01",
        title: "Take a photo",
        description: "Use your camera",
      },
      {
        value: "gallery",
        icon: "image-01",
        title: "Choose from gallery",
        description: "Photos and screenshots",
      },
      {
        value: "file",
        icon: "file-02",
        title: "Choose a file",
        description: "PDF, Word, Excel · up to 20 MB",
      },
    ],
  },
} satisfies Meta<typeof AttachSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};
