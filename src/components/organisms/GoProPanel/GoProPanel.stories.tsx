import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { GoProPanel } from "./GoProPanel";

const meta = {
  title: "Organisms/Go Pro panel",
  component: GoProPanel,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Figma: Prototype › Overlay · Go Pro (166:28764).",
      },
    },
  },
  args: {
    name: "MultiAI Pro",
    price: "৳1,599",
    period: "a month",
    tagline: "For people who use AI every day.",
    plans: {
      payg: {
        title: "Pay as you go",
        features: [
          "Buy credits from ৳99",
          "Credits never expire",
          "All standard AIs",
        ],
      },
      pro: {
        title: "Pro",
        features: [
          "159,900 credits each month",
          "Premium AIs and video",
          "Priority when AIs are busy",
        ],
      },
    },
    note: "Pay as you go is cheaper if you ask a few questions a week. Pro credits reset monthly; cancel any time.",
    closeLabel: "Close",
    notNowLabel: "Not now",
    upgradeLabel: "Upgrade with bKash · ৳1,599",
  },
} satisfies Meta<typeof GoProPanel>;

export default meta;
export const Default: StoryObj<typeof meta> = {};
