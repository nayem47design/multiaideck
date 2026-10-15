import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { Button } from "@/components/atoms/Button";

import { NewProjectDialog, NewProjectPanel } from "./NewProjectDialog";

const CONTENT = {
  title: "New project",
  body: "Group related chats in one place. You can rename or delete it later.",
  label: "Project name",
  placeholder: "e.g. Coffee brand",
  cancelLabel: "Cancel",
  submitLabel: "Create project",
};

const meta = {
  title: "Organisms/New project dialog",
  component: NewProjectPanel,
  parameters: {
    docs: {
      description: {
        component:
          "Figma: Prototype › Overlay · New project (245:36384, Dark 245:36921). Below 768px a bottom sheet.",
      },
    },
  },
  args: {
    ...CONTENT,
    value: "",
    onValueChange: () => {},
    onSubmit: () => {},
    onCancel: () => {},
  },
} satisfies Meta<typeof NewProjectPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * As drawn in Figma: the empty field focused, Create project enabled. (In the app, Create is
 * disabled while the name is empty: see State · Empty.)
 */
export const Default: Story = {
  args: { autoFocus: true, submitDisabled: false },
};
export const StateEmpty: Story = {
  name: "State · Empty (Create disabled)",
};
export const StateFilled: Story = {
  name: "State · Filled",
  args: { value: "Coffee brand" },
};
export const StateSaving: Story = {
  name: "State · Saving",
  args: { value: "Coffee brand", busy: true },
};
export const StateDuplicate: Story = {
  name: "State · Name taken",
  args: {
    value: "Coffee brand",
    error: "You already have a project called “Coffee brand”.",
  },
};
export const Rename: Story = {
  name: "Rename project",
  args: {
    title: "Rename project",
    body: "Its chats stay in it.",
    submitLabel: "Save",
    submitIcon: "pencil-edit-02",
    value: "Coffee brand",
  },
};

/** Opened over the page. */
export const Open: Story = {
  parameters: { layout: "fullscreen" },
  render: function Render(args) {
    const [open, setOpen] = useState(true);
    const [value, setValue] = useState("");
    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          New project
        </Button>
        <NewProjectDialog
          {...args}
          value={value}
          onValueChange={setValue}
          open={open}
          onOpenChange={setOpen}
          onSubmit={() => setOpen(false)}
        />
      </>
    );
  },
};
