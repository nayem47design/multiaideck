import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SegmentedControl } from "@/components/molecules/SegmentedControl";
import { Select } from "@/components/molecules/Select";

import { PreferencesCard } from "./PreferencesCard";

// Figma's Preferences card frame is 824px wide.
function frame(width: number, height?: number) {
  return function Frame(Story: () => React.JSX.Element) {
    return (
      <div style={{ width, height }}>
        <Story />
      </div>
    );
  };
}

const segmented = (label: string, ...labels: string[]) => (
  <SegmentedControl
    label={label}
    value="0"
    options={labels.map((l, i) => ({ value: String(i), label: l }))}
  />
);

const meta = {
  title: "Organisms/Preferences card",
  component: PreferencesCard,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Preferences card (103:29258).",
      },
    },
  },
  args: {
    title: "Preferences",
    rows: [
      {
        title: "App language",
        help: "Menus, buttons and messages.",
        control: segmented("App language", "English", "Bangla"),
      },
      {
        title: "Theme",
        help: "System follows your device's light or dark setting.",
        control: segmented("Theme", "System", "Light", "Dark"),
      },
      {
        title: "Text size",
        help: "Makes all text bigger: answers, menus and buttons. Saved on this device.",
        control: segmented("Text size", "Normal", "Large", "Larger"),
      },
      {
        title: "Answer language",
        help: "The language models reply in.",
        control: (
          <Select
            label="Answer language"
            defaultValue="same"
            className="w-select-width"
            options={[
              { value: "same", label: "Same as my question" },
              { value: "en", label: "English" },
              { value: "bn", label: "Bangla" },
            ]}
          />
        ),
      },
      {
        title: "Show amounts as",
        help: "How costs appear across MultiAI.",
        control: segmented("Show amounts as", "Credits + taka", "Credits only"),
      },
      {
        title: "Text density",
        help: "How much fits on screen.",
        control: segmented("Text density", "Comfortable", "Compact"),
      },
    ],
  },
  decorators: [frame(824)],
} satisfies Meta<typeof PreferencesCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
