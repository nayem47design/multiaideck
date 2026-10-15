import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import {
  SearchChatsPanel,
  type SearchChatsPanelProps,
} from "./SearchChatsPanel";

function Stateful(props: SearchChatsPanelProps) {
  const [query, setQuery] = useState(props.query);
  const [active, setActive] = useState(props.activeIndex);
  return (
    <SearchChatsPanel
      {...props}
      query={query}
      onQueryChange={setQuery}
      activeIndex={active}
      onActiveIndexChange={setActive}
    />
  );
}

const labels = {
  search: "Search your chats",
  count: "2 chats match",
  empty: "No chats match “tea”",
  esc: "Esc",
  keys: "↑ ↓ to move · ↵ to open · Esc to close",
  enter: "↵",
};

const meta = {
  title: "Organisms/Search chats panel",
  component: SearchChatsPanel,
  render: (args) => <Stateful {...args} />,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Figma: Prototype › Overlay · Search chats (166:27803).",
      },
    },
  },
  args: {
    query: "coffee",
    onQueryChange: () => {},
    activeIndex: 0,
    onActiveIndexChange: () => {},
    onOpen: () => {},
    labels,
    results: [
      {
        id: "coffee-shop-names",
        title: "Coffee shop names",
        detail: "“…a small coffee shop in Dhaka” · Today",
        models: ["gpt", "claude", "gemini"],
      },
      {
        id: "golpo-coffee-sign",
        title: "Golpo Coffee sign",
        detail: "Image · Today",
        models: ["gemini"],
      },
    ],
  },
} satisfies Meta<typeof SearchChatsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SecondActive: Story = { args: { activeIndex: 1 } };
export const NoMatches: Story = { args: { query: "tea", results: [] } };
export const Dark: Story = { globals: { theme: "dark" } };
