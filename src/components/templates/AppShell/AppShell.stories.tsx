import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { composer, sidebar, Slot } from "../templates.fixtures";
import { AppShell } from "./AppShell";

const meta = {
  title: "Templates/App shell",
  component: AppShell,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Figma: Design system › Template/App shell (28:9266).",
      },
    },
  },
  args: {
    sidebar,
    composer,
    children: <Slot label="SLOT · Hero or answer thread" className="h-full" />,
  },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
