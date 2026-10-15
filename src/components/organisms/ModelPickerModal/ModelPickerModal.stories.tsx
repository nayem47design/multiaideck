import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ModelPickerPanel, type PickerModel } from "./ModelPickerModal";

const v = (label: string) => [{ value: label, label }];
const model = (
  id: string,
  m: PickerModel["model"],
  name: string,
  provider: string,
  version: string,
  tags: string[],
  speed: 1 | 2 | 3,
  cost: string,
): PickerModel => ({
  id,
  model: m,
  name,
  provider,
  versions: v(version),
  version,
  tags,
  speed,
  cost,
});

const meta = {
  title: "Organisms/Model picker modal",
  component: ModelPickerPanel,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Model picker modal (28:9076).",
      },
    },
  },
  args: {
    labels: {
      title: "Choose models",
      subtitle:
        "Pick which models answer in this chat. Compare speed and cost before you choose.",
      close: "Close",
      selected: "3 selected",
      estimate: "≈ 17 credits per prompt",
      remove: (name: string) => `Remove ${name}`,
      tabs: [
        { value: "chat", label: "Chat models", count: "11" },
        { value: "image", label: "Image models", count: "2" },
      ],
      search: "Search models or providers",
      preset: "Preset: My default",
      goodFor: "Good for",
      columns: {
        model: "MODEL",
        version: "VERSION",
        tags: "GOOD FOR",
        speed: "SPEED",
        cost: "PER ANSWER",
      },
      selectedGroup: "SELECTED · 3",
      moreGroup: "MORE MODELS · 8",
      version: (name: string) => `${name} version`,
      reset: "Reset to default",
      hint: "Costs are typical for a short answer. Your receipt shows the exact amount.",
      savePreset: "Save as preset",
      apply: "Use these 3 models",
    },
    models: [
      model(
        "gpt",
        "gpt",
        "GPT-5",
        "OpenAI",
        "GPT-5",
        ["Balanced", "All-round"],
        2,
        "~6 cr",
      ),
      model(
        "claude",
        "claude",
        "Claude Sonnet 4",
        "Anthropic",
        "Sonnet 4",
        ["Writing", "Long docs"],
        2,
        "~8 cr",
      ),
      model(
        "gemini",
        "gemini",
        "Gemini 3 Flash",
        "Google",
        "3 Flash Preview",
        ["Fast", "Images in"],
        3,
        "~3 cr",
      ),
      model(
        "o3",
        "o3",
        "o3",
        "OpenAI",
        "o3",
        ["Reasoning", "Maths"],
        1,
        "~14 cr",
      ),
      model(
        "deepseek",
        "deepseek",
        "DeepSeek",
        "DeepSeek",
        "V3.2",
        ["Reasoning", "Low cost"],
        2,
        "~2 cr",
      ),
      model(
        "perplexity",
        "perplexity",
        "Perplexity",
        "Perplexity",
        "Sonar Pro",
        ["Web search", "Sources"],
        2,
        "~5 cr",
      ),
      model("grok", "grok", "Grok", "xAI", "4.20", ["Real-time"], 2, "~7 cr"),
      model(
        "llama",
        "llama",
        "Llama",
        "Meta",
        "4 Scout",
        ["Fast", "Open source"],
        3,
        "~1 cr",
      ),
      model(
        "qwen",
        "qwen",
        "Qwen",
        "Alibaba",
        "3.5 Plus",
        ["Multilingual"],
        2,
        "~2 cr",
      ),
    ],
    selected: ["gpt", "claude", "gemini"],
    onToggle: () => {},
    onVersionChange: () => {},
    tab: "chat",
    onTabChange: () => {},
    filters: [
      { value: "all", label: "All" },
      { value: "writing", label: "Writing" },
      { value: "reasoning", label: "Reasoning" },
      { value: "fast", label: "Fast & low cost" },
      { value: "web", label: "Web search" },
      { value: "open", label: "Open source" },
      { value: "bangla", label: "Bangla" },
    ],
    filter: "all",
    onFilterChange: () => {},
  },
} satisfies Meta<typeof ModelPickerPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
