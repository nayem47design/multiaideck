import { Slot } from "radix-ui";
import type { HTMLAttributes, ReactElement, Ref } from "react";

import { Icon, type IconName } from "@/components/atoms/Icon";
import { cx } from "@/components/atoms/states";

// Figma: Design system › Menu item (245:28774): Type=Default / Hover / Danger. An icon, a label,
// an optional trailing text (a shortcut such as "⌘," or a value such as "English") and an
// optional submenu chevron. Type=Hover is the look of a pointer-hovered or keyboard-highlighted
// item (Radix data-highlighted); pass type="hover" only to show it statically.
//
// Used inside a Radix DropdownMenu.Item asChild, so it forwards every prop and its ref. With
// `asChild` the item is its child, an empty link element (<a> or Next.js <Link>).

export type MenuItemType = "default" | "hover" | "danger";

export interface MenuItemProps extends HTMLAttributes<HTMLElement> {
  icon: IconName;
  label: string;
  /** Figma Trailing, e.g. "⌘," or the current language. */
  trailing?: string;
  /** Figma Submenu: a chevron at the end. */
  submenu?: boolean;
  type?: MenuItemType;
  asChild?: boolean;
  children?: ReactElement;
  ref?: Ref<HTMLElement>;
}

export function MenuItem({
  icon,
  label,
  trailing,
  submenu = false,
  type = "default",
  asChild = false,
  className,
  children,
  ref,
  ...props
}: MenuItemProps) {
  const Component = asChild ? Slot.Root : "div";
  const danger = type === "danger";
  return (
    <Component
      ref={ref as Ref<HTMLDivElement>}
      className={cx(
        "flex h-menu-item-height w-full cursor-pointer items-center gap-menu-item-gap rounded-menu-item px-menu-item-pad text-left outline-none select-none",
        "transition-colors duration-fast ease-out hover:bg-canvas-deep data-highlighted:bg-canvas-deep",
        "focus-visible:bg-canvas-deep",
        type === "hover" && "bg-canvas-deep",
        className,
      )}
      {...props}
    >
      {asChild && <Slot.Slottable>{children}</Slot.Slottable>}
      <Icon
        name={icon}
        className={cx(
          "size-menu-item-icon shrink-0",
          danger ? "text-error" : "text-ink-2",
        )}
      />
      <span
        className={cx(
          "min-w-0 flex-1 truncate type-menu-item-label",
          danger ? "text-error" : "text-ink",
        )}
      >
        {label}
      </span>
      {trailing && (
        <span className="shrink-0 type-menu-item-trailing text-ink-3">
          {trailing}
        </span>
      )}
      {submenu && (
        <Icon
          name="arrow-right-01"
          className="size-menu-item-submenu-icon shrink-0 text-ink-3"
        />
      )}
    </Component>
  );
}
