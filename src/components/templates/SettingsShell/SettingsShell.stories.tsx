import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { settingsNav, Slot, topBar } from "../templates.fixtures";
import { SettingsShell } from "./SettingsShell";

const meta = {
  title: "Templates/Settings shell",
  component: SettingsShell,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Figma: Design system › Template/Settings shell (28:9322).",
      },
    },
  },
  args: {
    topBar,
    nav: settingsNav,
    children: (
      <Slot label="SLOT · Page title + setting cards" className="h-[740px]" />
    ),
  },
} satisfies Meta<typeof SettingsShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
