import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SignInMethodsCard } from "./SignInMethodsCard";

function frame(width: number) {
  return function Frame(Story: () => React.JSX.Element) {
    return (
      <div style={{ width }}>
        <Story />
      </div>
    );
  };
}

const meta = {
  title: "Organisms/Sign-in methods card",
  component: SignInMethodsCard,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Sign-in methods card (103:21212).",
      },
    },
    pseudo: { focusWithin: ["label:first-of-type > span"] },
  },
  args: {
    title: "Sign-in methods",
    methods: [
      {
        id: "google",
        icon: "user",
        title: "Google",
        help: "alhossain@musemind.agency · your main sign-in",
        status: { label: "Connected", connected: true },
      },
      {
        id: "password",
        icon: "key-01",
        title: "Email and password",
        help: "Not set. Add one to sign in without Google.",
        status: { label: "Not set", connected: false },
      },
    ],
    setPassword: {
      afterMethod: "password",
      form: {
        password: {
          label: "New password",
          value: "correcthor",
          onValueChange: () => {},
        },
        confirm: {
          label: "Confirm password",
          value: "",
          placeholder: "Type it again",
          onValueChange: () => {},
        },
        strength: {
          score: 2,
          label: "Fair",
          rules: [
            { label: "8+ characters", met: true },
            { label: "A number or symbol", met: false },
          ],
        },
        showLabel: "Show password",
        hideLabel: "Hide password",
        cancelLabel: "Cancel",
        submitLabel: "Set password",
      },
    },
  },
  decorators: [frame(824)],
} satisfies Meta<typeof SignInMethodsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
