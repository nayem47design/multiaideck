import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CalloutLink } from "./CalloutLink";

const meta = {
  title: "Molecules/Callout link",
  component: CalloutLink,
  parameters: {
    docs: {
      description: {
        component: "Figma: Prototype › Wallet › Usage link (28:9923).",
      },
    },
  },
  args: {
    icon: "chart-histogram",
    text: "Where your credits went and every chat’s cost now live in Settings → Usage.",
    link: <a href="#" />,
    linkLabel: "See usage →",
  },
} satisfies Meta<typeof CalloutLink>;

export default meta;
export const Default: StoryObj<typeof meta> = {};
