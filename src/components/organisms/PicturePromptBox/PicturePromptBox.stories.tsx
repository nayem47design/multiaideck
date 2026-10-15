import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import {
  PicturePromptBox,
  type PicturePromptBoxProps,
} from "./PicturePromptBox";

function Stateful(props: PicturePromptBoxProps) {
  const [prompt, setPrompt] = useState(props.prompt);
  const [style, setStyle] = useState(props.style);
  return (
    <PicturePromptBox
      {...props}
      prompt={prompt}
      onPromptChange={setPrompt}
      style={style}
      onStyleChange={setStyle}
    />
  );
}

const meta = {
  title: "Organisms/Picture prompt box",
  component: PicturePromptBox,
  render: (args) => <Stateful {...args} />,
  parameters: {
    docs: {
      description: {
        component:
          "Figma: Prototype › Image studio › Prompt box; M21 · Make a picture › Picture sheet below 768px.",
      },
    },
  },
  args: {
    prompt: "A cosy coffee shop sign that says “Golpo Coffee”, warm colours",
    onPromptChange: () => {},
    style: "drawing",
    onStyleChange: () => {},
    onCreate: () => {},
    styles: [
      { value: "photo", label: "Photo" },
      { value: "drawing", label: "Drawing" },
      { value: "logo", label: "Logo" },
      { value: "poster", label: "Poster" },
    ],
    labels: {
      prompt: "Describe your picture",
      placeholder: "Describe the picture you want…",
      style: "Style",
      cost: "≈ 40 cr",
      costLong: "Each picture costs about 40 credits (৳0.40)",
      create: "Create picture",
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 860, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PicturePromptBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = { args: { prompt: "" } };
export const Creating: Story = { args: { creating: true } };
export const Mobile: Story = { globals: { viewport: { value: "mobile1" } } };
export const Dark: Story = { globals: { theme: "dark" } };
