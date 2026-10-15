import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { LanguageSheet } from "./LanguageSheet";

const meta = {
  title: "Organisms/Language sheet",
  component: LanguageSheet,
  parameters: {
    docs: {
      description: {
        component: "Figma: Prototype › M39 · Language › Language sheet.",
      },
    },
  },
  args: {
    open: true,
    onOpenChange: () => {},
    title: "App language",
    options: [
      {
        value: "en",
        title: "English",
        help: "Menus and buttons in English",
        lang: "en",
      },
      {
        value: "bn",
        title: "বাংলা",
        help: "মেনু ও বোতাম বাংলায়",
        lang: "bn",
      },
    ],
    value: "en",
    onValueChange: () => {},
    note: "You can ask questions in either language, whatever you choose here.",
    doneLabel: "Done",
    onDone: () => {},
  },
} satisfies Meta<typeof LanguageSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** As in Figma: English selected. */
export const Default: Story = {};
export const Interactive: Story = {
  render: function Render(args) {
    const [value, setValue] = useState("en");
    return <LanguageSheet {...args} value={value} onValueChange={setValue} />;
  },
};
