import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SegmentedControl } from "@/components/molecules/SegmentedControl";

import { PreferencesRow } from "./PreferencesCard";

// Figma: Settings card › Type=Preferences › Row/Text size (292:55655), 774px wide. One story per
// option in Light and Dark, and a narrow row where the control wraps below the title and help.
const LABELS = ["Extra small", "Small", "Normal", "Large", "Larger"];
const VALUES = ["xsmall", "small", "normal", "large", "larger"];

const control = (value: string) => (
  <SegmentedControl
    label="Text size"
    value={value}
    options={VALUES.map((v, i) => ({ value: v, label: LABELS[i] }))}
    className="[&>*]:px-4"
  />
);

const meta = {
  title: "Organisms/Preferences card/Text size row",
  component: PreferencesRow,
  parameters: {
    width: 774,
    docs: {
      description: {
        component:
          "Figma: Settings card › Type=Preferences › Row/Text size (292:55655). Five options; the control wraps under the title and help when the row is narrower than 48rem.",
      },
    },
  },
  args: {
    title: "Text size",
    help: "Changes the size of all text: answers, menus and buttons. Saved on this device.",
    wrap: true,
    control: control("normal"),
  },
  decorators: [
    (Story, { parameters }) => (
      <div style={{ width: parameters.width as number }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PreferencesRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const dark = { globals: { theme: "dark" } };

export const ExtraSmall: Story = { args: { control: control("xsmall") } };
export const ExtraSmallDark: Story = {
  args: { control: control("xsmall") },
  ...dark,
};
export const Small: Story = { args: { control: control("small") } };
export const SmallDark: Story = {
  args: { control: control("small") },
  ...dark,
};
/** As in Figma: Normal chosen. */
export const Normal: Story = {};
export const NormalDark: Story = { ...dark };
export const Large: Story = { args: { control: control("large") } };
export const LargeDark: Story = {
  args: { control: control("large") },
  ...dark,
};
export const Larger: Story = { args: { control: control("larger") } };
export const LargerDark: Story = {
  args: { control: control("larger") },
  ...dark,
};
/** Narrow (tablet Settings): the control wraps below the title and help. */
export const Narrow: Story = { parameters: { width: 476 } };
