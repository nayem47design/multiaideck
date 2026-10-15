import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LanguageOption } from "./LanguageOption";

const meta = {
  title: "Molecules/Language option",
  component: LanguageOption,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Figma: Prototype › M1 · Welcome & language › Option · English / Option · বাংলা.",
      },
    },
  },
  args: { children: "English" },
  decorators: [
    (Story) => (
      <div role="radiogroup" aria-label="Language" style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LanguageOption>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Selected: Story = { args: { selected: true } };
export const Unselected: Story = { args: { children: "বাংলা", lang: "bn" } };
export const DarkSelected: Story = {
  args: { selected: true },
  globals: { theme: "dark" },
};
