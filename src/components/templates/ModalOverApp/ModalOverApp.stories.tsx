import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DeleteDialogPanel } from "@/components/organisms/DeleteDialog";
import DeleteDialogStories from "@/components/organisms/DeleteDialog/DeleteDialog.stories";

import { composer, sidebar, Slot } from "../templates.fixtures";
import { AppShell } from "../AppShell";
import { ModalOverApp } from "./ModalOverApp";

const meta = {
  title: "Templates/Modal over app",
  component: ModalOverApp,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Figma: Design system › Template/Modal over app (28:9394).",
      },
    },
  },
  args: {
    open: true,
    onOpenChange: () => {},
    children: (
      <DeleteDialogPanel
        {...(DeleteDialogStories.args as React.ComponentProps<
          typeof DeleteDialogPanel
        >)}
      />
    ),
  },
  render: (args) => (
    <>
      <AppShell sidebar={sidebar} composer={composer}>
        <Slot label="SLOT · Hero or answer thread" className="h-full" />
      </AppShell>
      <ModalOverApp {...args} />
    </>
  ),
} satisfies Meta<typeof ModalOverApp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
