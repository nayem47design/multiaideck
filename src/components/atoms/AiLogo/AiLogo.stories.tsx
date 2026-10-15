import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AiLogo, AI_LOGOS, type AiBrand, type AiLogoStyle } from ".";

const BRANDS = Object.keys(AI_LOGOS) as AiBrand[];
const STYLES: AiLogoStyle[] = ["color", "app-icon", "black", "white"];

const meta = {
  title: "Atoms/AI logo",
  component: AiLogo,
  parameters: {
    docs: {
      description: {
        component:
          "Figma: Design system › AI logos › AI logo (268:41860), Brand × Style. Trademarks of their owners.",
      },
    },
  },
  args: { brand: "claude", style: "color", sizeClassName: "size-12" },
  argTypes: {
    brand: { control: "select", options: BRANDS },
    style: { control: "inline-radio", options: [...STYLES, "mono"] },
  },
} satisfies Meta<typeof AiLogo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Logo: Story = {};
export const AppIcon: Story = { args: { style: "app-icon" } };
/** Black on the light theme, White on the dark one. */
export const Mono: Story = { args: { style: "mono" } };

/** Every brand, one row per Style, on Figma's neutral board so White stays visible. */
export const All: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-4 rounded-2xl bg-ink-3 p-4">
      {STYLES.map((style) => (
        <div key={style} className="flex flex-wrap gap-4">
          {BRANDS.map((brand) => (
            <AiLogo
              key={brand}
              brand={brand}
              style={style}
              sizeClassName="size-8"
            />
          ))}
        </div>
      ))}
    </div>
  ),
};
