import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { SignInCard, type SignInCardProps } from "./SignInCard";

function Stateful(props: SignInCardProps) {
  const [phone, setPhone] = useState(props.phone);
  return <SignInCard {...props} phone={phone} onPhoneChange={setPhone} />;
}

const meta = {
  title: "Organisms/Sign in card",
  component: SignInCard,
  render: (args) => <Stateful {...args} />,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Figma: Prototype › Desktop · Sign in › Sign in card; M16 · Sign in: phone number below 768px.",
      },
    },
  },
  args: {
    phone: "1712 345 214",
    onPhoneChange: () => {},
    onSend: () => {},
    onGoogle: () => {},
    labels: {
      title: "Sign in or create an account",
      mobileTitle: "Sign in with your phone",
      subtitle: "We’ll text you a 6-digit code. No password.",
      mobileSubtitle: "We’ll send a 6-digit code by SMS. No password needed.",
      phone: "Mobile number",
      phoneHelp: "Mobile number (Bangladesh)",
      placeholder: "1712 345 214",
      prefix: "+880",
      country: "Bangladesh",
      send: "Send code",
      or: "or",
      google: "Continue with Google",
      terms: "By continuing you agree to the Terms and Privacy Policy.",
    },
  },
} satisfies Meta<typeof SignInCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = { args: { phone: "" } };
export const Sending: Story = { args: { sending: true } };
export const Invalid: Story = {
  args: {
    phone: "1712",
    error: "Enter a 10-digit mobile number, like 1712 345 214.",
  },
};
export const Mobile: Story = {
  parameters: { layout: "fullscreen" },
  globals: { viewport: { value: "mobile1" } },
};
export const Dark: Story = { globals: { theme: "dark" } };
