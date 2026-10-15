import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MobileTopBar } from "@/components/organisms/MobileTopBar";

import { AppShell } from "../AppShell";
import { sidebar, Slot } from "../templates.fixtures";
import { BrowseColumn } from "./BrowseColumn";

const meta = {
  title: "Templates/Browse column",
  component: BrowseColumn,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The 860px main column of Prototype › Chats, Image studio and Presets, inside the app shell.",
      },
    },
  },
  args: {
    children: (
      <Slot
        label="SLOT · Page head, list or grid"
        className="h-screen-mobile"
      />
    ),
    mobileTopBar: <MobileTopBar title="Chats" />,
  },
  decorators: [(Story) => <AppShell sidebar={sidebar}>{Story()}</AppShell>],
} satisfies Meta<typeof BrowseColumn>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithToast: Story = {
  args: { toast: { id: 1, tone: "success", message: "Preset saved" } },
};
export const Mobile: Story = {
  args: { tabBar: true },
  globals: { viewport: { value: "mobile1" } },
};
