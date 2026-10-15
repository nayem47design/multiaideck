import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { Button } from "@/components/atoms/Button";

import { DeleteDialog, DeleteDialogPanel } from "./DeleteDialog";

const CONTENT = {
  title: "Delete your account?",
  body: "This can’t be undone. You will lose:",
  losses: [
    { label: "Chats", value: "4 chats and their history" },
    { label: "Credits", value: "10,684 credits (≈ BDT 106.84)", strong: true },
    { label: "Profile", value: "Name, photo and preferences" },
  ],
  download: { label: "Download your data first", link: <a href="#" /> },
  confirmLabel: "Type DELETE to confirm",
  confirmWord: "DELETE",
  cancelLabel: "Keep my account",
  deleteLabel: "Delete account",
};

const meta = {
  title: "Organisms/Delete dialog",
  component: DeleteDialogPanel,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Delete dialog (28:9112).",
      },
    },
  },
  args: { ...CONTENT, value: "DELETE", onValueChange: () => {} },
} satisfies Meta<typeof DeleteDialogPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The dialog box on its own, as in Figma. */
export const Default: Story = {};
export const StateEmpty: Story = {
  name: "State · Not confirmed",
  args: { value: "" },
};

/** Opened over the page. */
export const Open: Story = {
  parameters: { layout: "fullscreen" },
  render: function Render() {
    const [open, setOpen] = useState(true);
    return (
      <>
        <Button variant="destructive" onClick={() => setOpen(true)}>
          Delete account
        </Button>
        <DeleteDialog
          {...CONTENT}
          open={open}
          onOpenChange={setOpen}
          onDelete={() => setOpen(false)}
        />
      </>
    );
  },
};
