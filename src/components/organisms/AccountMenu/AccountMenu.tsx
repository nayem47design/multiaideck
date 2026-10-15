import { DropdownMenu } from "radix-ui";
import { useRef, type ReactElement } from "react";

import { Divider } from "@/components/atoms/Divider";
import type { IconName } from "@/components/atoms/Icon";
import { cx } from "@/components/atoms/states";
import { MenuItem } from "@/components/molecules/MenuItem";

// Figma: Design system › Account menu (245:28819), shown on "Overlay · Account menu": the menu the
// sidebar's account row (or its ⋯, or the rail's avatar) opens. Settings, Usage & billing,
// Language (current value + chevron), Help & support, a divider, then Sign out in lum/error.
// A Radix DropdownMenu: arrow keys move, Enter picks, Esc closes and focus returns to the trigger.
// In Figma the menu's bottom sits 8px above the account row, 16px in from its left edge.

type LinkElement = ReactElement<{ className?: string }>;

export interface AccountMenuEntry {
  id: string;
  icon: IconName;
  label: string;
  /** e.g. "⌘," or the current language. */
  trailing?: string;
  submenu?: boolean;
  tone?: "default" | "danger";
  /** Draw the divider above this item (Figma: above Sign out). */
  separatorBefore?: boolean;
  /** An empty link element (<a> or Next.js <Link>) for items that go to a page. */
  link?: LinkElement;
  onSelect?: () => void;
}

export interface AccountMenuProps {
  items: AccountMenuEntry[];
  /** The menu's accessible name, e.g. "Account menu". */
  label: string;
  /** The trigger: the account row, its ⋯ or the rail avatar. */
  children: ReactElement;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
  /** false renders the menu in place (Storybook); the app portals it to <body>. */
  portal?: boolean;
}

export function AccountMenu({
  items,
  label,
  children,
  open,
  defaultOpen,
  onOpenChange,
  side = "top",
  align = "start",
  sideOffset = 8,
  alignOffset = 16,
  portal = true,
}: AccountMenuProps) {
  // An item's action (e.g. Sign out opening a dialog) runs once the menu has closed and focus is
  // back on the trigger, so the dialog returns focus there when it closes.
  const pending = useRef<(() => void) | undefined>(undefined);
  const content = (
    <DropdownMenu.Content
      aria-label={label}
      side={side}
      align={align}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      collisionPadding={portal ? 8 : 0}
      onCloseAutoFocus={() => {
        const action = pending.current;
        pending.current = undefined;
        if (action) queueMicrotask(action);
      }}
      className={cx(
        "z-50 flex w-account-menu-width flex-col gap-account-menu-gap rounded-account-menu border border-glass-rim bg-surface p-account-menu-pad shadow-account-menu outline-none",
      )}
    >
      {items.map((item) => [
        item.separatorBefore && (
          <DropdownMenu.Separator key={`${item.id}-sep`} asChild>
            <Divider />
          </DropdownMenu.Separator>
        ),
        <DropdownMenu.Item
          key={item.id}
          asChild
          onSelect={() => {
            pending.current = item.onSelect;
          }}
        >
          <MenuItem
            icon={item.icon}
            label={item.label}
            trailing={item.trailing}
            submenu={item.submenu}
            type={item.tone === "danger" ? "danger" : "default"}
            asChild={!!item.link}
          >
            {item.link}
          </MenuItem>
        </DropdownMenu.Item>,
      ])}
    </DropdownMenu.Content>
  );

  return (
    <DropdownMenu.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      // Not modal: Sign out opens a dialog right after the menu closes.
      modal={false}
    >
      {/* The menu comes first so an in-place (Storybook) render puts it before the trigger. */}
      {portal ? <DropdownMenu.Portal>{content}</DropdownMenu.Portal> : content}
      <DropdownMenu.Trigger asChild>{children}</DropdownMenu.Trigger>
    </DropdownMenu.Root>
  );
}
