import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LanguageSwitch } from "./LanguageSwitch";

const meta = {
  title: "Molecules/Language switch",
  component: LanguageSwitch,
  parameters: {
    docs: {
      description: {
        component: "Not a Figma component yet: “Language switch” on M2 · Home.",
      },
    },
  },
  args: {
    label: "Language",
    options: [
      {
        label: "EN",
        name: "English",
        lang: "en",
        link: <a href="#en" />,
        selected: true,
      },
      { label: "বাং", name: "বাংলা", lang: "bn", link: <a href="#bn" /> },
    ],
  },
} satisfies Meta<typeof LanguageSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const English: Story = {};
