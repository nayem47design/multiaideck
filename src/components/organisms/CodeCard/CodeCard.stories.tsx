import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { CodeCard, type CodeCardProps } from "./CodeCard";

function Stateful(props: CodeCardProps) {
  const [code, setCode] = useState(props.code);
  return <CodeCard {...props} code={code} onCodeChange={setCode} />;
}

const meta = {
  title: "Organisms/Code card",
  component: CodeCard,
  render: (args) => <Stateful {...args} />,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Figma: Prototype › Desktop · Enter code › Code card; M17 · Enter the code below 768px.",
      },
    },
  },
  args: {
    code: "482",
    onCodeChange: () => {},
    onVerify: () => {},
    resendIn: 42,
    onResend: () => {},
    changeLink: <a href="#" />,
    labels: {
      title: "Enter the code",
      sentTo: "Sent by SMS to +880 1712 345 214",
      code: "6-digit code",
      digit: (n: number) => `Digit ${n}`,
      resendIn: "Resend code in 0:42",
      resend: "Resend code",
      autoFill: "The code fills in by itself on most phones.",
      verify: "Verify and continue",
      change: "Wrong number? Change it",
    },
  },
} satisfies Meta<typeof CodeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Partly: Story = {};
export const Complete: Story = { args: { code: "482913" } };
export const Verifying: Story = { args: { code: "482913", verifying: true } };
export const WrongCode: Story = {
  args: {
    code: "482913",
    error: "That code isn’t right. Check the SMS and try again.",
  },
};
export const CanResend: Story = { args: { resendIn: 0 } };
export const Mobile: Story = {
  parameters: { layout: "fullscreen" },
  globals: { viewport: { value: "mobile1" } },
};
export const Dark: Story = { globals: { theme: "dark" } };
