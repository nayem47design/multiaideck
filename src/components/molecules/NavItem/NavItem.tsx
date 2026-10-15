import { Slot } from "radix-ui";
import type { AnchorHTMLAttributes, Ref } from "react";

import { Icon, type IconName } from "@/components/atoms/Icon";
import { cx, focusRing } from "@/components/atoms/states";

// Figma: Design system › Nav item (28:8334). State=Selected is `selected`; Trailing=External is
// `external`. Use `asChild` to render a Next.js <Link>.

export interface NavItemProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  icon: IconName;
  selected?: boolean;
  external?: boolean;
  asChild?: boolean;
  /** Replaces the default height (an h-* class), where Figma resizes the instance (Sidebar: 32px). */
  heightClassName?: string;
  ref?: Ref<HTMLAnchorElement>;
}

export function NavItem({
  icon,
  selected = false,
  external = false,
  asChild = false,
  heightClassName = "h-control-md",
  className,
  children,
  ref,
  ...props
}: NavItemProps) {
  const Component = asChild ? Slot.Root : "a";
  return (
    <Component
      ref={ref}
      aria-current={selected ? "page" : undefined}
      className={cx(
        "flex w-full items-center gap-2 rounded-pill px-3",
        heightClassName,
        "transition-colors duration-fast ease-out",
        selected
          ? "border border-glass-rim bg-glass-fill-strong type-nav-item-selected text-ink"
          : "type-nav-item text-ink-2 hover:bg-canvas-deep hover:text-ink",
        focusRing,
        className,
      )}
      {...(external && !asChild ? { target: "_blank", rel: "noreferrer" } : {})}
      {...props}
    >
      <Icon name={icon} className="size-icon-sm" />
      <Slot.Slottable>{children}</Slot.Slottable>
      {external && (
        <Icon
          name="link-square-02"
          className="ml-auto size-nav-item-trailing-icon text-ink-3"
        />
      )}
    </Component>
  );
}
