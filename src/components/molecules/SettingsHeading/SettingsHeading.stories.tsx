import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "@/components/atoms/Button";

import { SettingsHeading } from "./SettingsHeading";

const meta = {
  title: "Molecules/Settings heading",
  component: SettingsHeading,
  parameters: {
    docs: {
      description: {
        component:
          "Figma: Prototype › Settings · Profile (28:10344): page title and subtitle.",
      },
    },
  },
  args: {
    title: "Profile",
    subtitle: "How you appear, and how MultiAI talks to you.",
  },
  decorators: [
    (Story) => (
      <div style={{ width: 824 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SettingsHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithActions: Story = {
  name: "With actions",
  args: {
    title: "Usage",
    subtitle:
      "Where your credits go, prompt by prompt. Top-ups and payments stay in Wallet.",
    actions: (
      <Button variant="secondary" size="sm" icon="download-01">
        Export CSV
      </Button>
    ),
  },
};
