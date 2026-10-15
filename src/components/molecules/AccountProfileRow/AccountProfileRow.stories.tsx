import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AccountProfileRow } from "./AccountProfileRow";

const meta = {
  title: "Molecules/Account profile row",
  component: AccountProfileRow,
  parameters: {
    docs: {
      description: {
        component: "Figma: Prototype › M15 · Account & settings › Profile.",
      },
    },
  },
  args: {
    initials: "AH",
    name: "Al Imam Hossain",
    detail: "+880 17•• ••• 214",
    link: <a href="#" />,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 328 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AccountProfileRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const LongName: Story = {
  name: "Long name",
  args: { name: "Mohammad Abdullah Al Mamun Chowdhury" },
};
