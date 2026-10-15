"use client";

import { ContextMenu, DropdownMenu } from "radix-ui";
import type { ReactNode } from "react";

import { Icon, type IconName } from "@/components/atoms/Icon";
import { cx } from "@/components/atoms/states";
import { chatRowMoreButton } from "@/components/molecules/ChatListRow";

// The chat row actions the Chats tip promises (rename, pin, delete). Not drawn in Figma: the menu
// reuses the Composer menu's glass panel. Opens from the row's "more" button, by right-click, or by
// press-and-hold on touch screens (Radix context menu).

export interface ChatRowAction {
  icon: IconName;
  label: string;
  onSelect: () => void;
  destructive?: boolean;
}

const panel =
  "z-50 flex w-max flex-col gap-0-5 rounded-lg border border-glass-rim p-1-5 glass-strong shadow-glass-strong";
const item = (destructive?: boolean) =>
  cx(
    "flex h-control-md cursor-pointer items-center gap-2 rounded-md px-3 type-ui-strong outline-none",
    "transition-colors duration-fast ease-out data-highlighted:bg-blue-soft",
    destructive ? "text-error" : "text-ink",
  );

export function ChatRowMoreMenu({
  label,
  actions,
}: {
  label: string;
  actions: ChatRowAction[];
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={label}
        title={label}
        className={chatRowMoreButton}
      >
        <Icon name="more-horizontal" className="size-icon-button-icon" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className={panel}
          // Keep focus where the action put it (e.g. the rename field).
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {actions.map((a) => (
            <DropdownMenu.Item
              key={a.label}
              onSelect={a.onSelect}
              className={item(a.destructive)}
            >
              <Icon name={a.icon} className="size-icon-sm" />
              {a.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function ChatRowContextMenu({
  actions,
  children,
}: {
  actions: ChatRowAction[];
  children: ReactNode;
}) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <div className="select-none md:select-auto">{children}</div>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content
          className={panel}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {actions.map((a) => (
            <ContextMenu.Item
              key={a.label}
              onSelect={a.onSelect}
              className={item(a.destructive)}
            >
              <Icon name={a.icon} className="size-icon-sm" />
              {a.label}
            </ContextMenu.Item>
          ))}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
