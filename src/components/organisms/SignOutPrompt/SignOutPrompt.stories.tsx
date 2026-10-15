import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SignOutPrompt } from "./SignOutPrompt";

const meta = {
  title: "Organisms/Sign out prompt",
  component: SignOutPrompt,
  parameters: {
    docs: {
      description: {
        component:
          "Figma: Prototype › Overlay · Sign out (166:28826); below 768px M43 · Sign out?.",
      },
    },
  },
  args: {
    open: true,
    onOpenChange: () => {},
    title: "Sign out of MultiAI?",
    body: "Your chats and 10,684 credits stay safe. Sign in again any time with your phone number.",
    stayLabel: "Stay signed in",
    signOutLabel: "Sign out",
    onSignOut: () => {},
  },
} satisfies Meta<typeof SignOutPrompt>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SigningOut: Story = {
  name: "State · Signing out",
  args: { signingOut: true },
};
