import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TopUpTable } from "./TopUpTable";

// Figma's Top-up table frame is 367px wide (its columns are clipped, as in Figma).
function frame(width: number, height?: number) {
  return function Frame(Story: () => React.JSX.Element) {
    return (
      <div style={{ width, height }}>
        <Story />
      </div>
    );
  };
}

const pack = (
  value: string,
  price: string,
  credits: string,
  chats: string,
  bonus?: string,
  tag?: string,
) => ({
  value,
  price,
  credits,
  chats,
  bonus,
  tag,
  noBonusLabel: "none",
});

const meta = {
  title: "Organisms/Top-up table",
  component: TopUpTable,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Top-up table (103:20863).",
      },
    },
  },
  args: {
    title: "1   Choose an amount",
    columns: {
      pay: "YOU PAY",
      get: "YOU GET",
      bonus: "BONUS",
      chats: "≈ CHATS",
    },
    packs: [
      pack("99", "BDT 99", "9,900 credits", " 380"),
      pack("399", "BDT 399", "41,895 credits", "1,610", "+5%"),
      pack("699", "BDT 699", "76,890 credits", "2,960", "+10%", "Most chosen"),
      pack("1299", "BDT 1,299", "149,385 credits", "5,750", "+15%"),
      pack("2499", "BDT 2,499", "299,880 credits", "11,530", "+20%"),
    ],
    value: "699",
    onValueChange: () => {},
    custom: { label: "Custom amount (from BDT 50)" },
    teams: { label: "Need more than BDT 2,499? Teams plan →", href: "#" },
    footnote: "Chats estimated from your average of 26 credits per chat.",
  },
  decorators: [frame(367)],
} satisfies Meta<typeof TopUpTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
