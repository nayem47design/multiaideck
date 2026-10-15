import { DropdownMenu } from "radix-ui";
import type { ReactNode } from "react";

import { Icon, type IconName } from "@/components/atoms/Icon";
import { cx } from "@/components/atoms/states";

// Figma: Design system › Composer menu (147:38907): the Composer's "+" menu. Figma shows the
// first item highlighted (lum/blue-soft); that is the hover / keyboard-focus look.

export interface ComposerMenuItem {
  icon: IconName;
  title: string;
  description?: string;
  onSelect: () => void;
}

export interface ComposerMenuProps {
  items: ComposerMenuItem[];
  /** The "+" button. */
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const panel = cx(
  "flex w-composer-menu-width flex-col gap-0-5 rounded-lg border border-glass-rim p-1-5 glass-strong shadow-glass-strong",
);

const item = cx(
  "flex cursor-pointer items-center gap-3 rounded-md p-composer-menu-item-pad outline-none",
  "transition-colors duration-fast ease-out data-highlighted:bg-blue-soft",
);

function ItemContent({
  icon,
  title,
  description,
}: Omit<ComposerMenuItem, "onSelect">) {
  return (
    <>
      <span className="flex size-control-md shrink-0 items-center justify-center rounded-sm bg-surface text-ink-2 ring-1 ring-line ring-inset">
        <Icon name={icon} className="size-icon-md" />
      </span>
      <span className="flex flex-col gap-0-5">
        <span className="type-ui-strong text-ink">{title}</span>
        {description && (
          <span className="type-caption text-ink-2">{description}</span>
        )}
      </span>
    </>
  );
}

export function ComposerMenu({
  items,
  children,
  open,
  onOpenChange,
}: ComposerMenuProps) {
  return (
    <DropdownMenu.Root open={open} onOpenChange={onOpenChange}>
      <DropdownMenu.Trigger asChild>{children}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="top"
          align="start"
          sideOffset={8}
          className={cx("z-50", panel)}
        >
          {items.map(({ onSelect, ...rest }) => (
            <DropdownMenu.Item
              key={rest.title}
              onSelect={onSelect}
              className={item}
            >
              <ItemContent {...rest} />
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/** The open menu on its own, as drawn in Figma (first item highlighted). For stories and tests. */
export function ComposerMenuPanel({
  items,
}: {
  items: Omit<ComposerMenuItem, "onSelect">[];
}) {
  return (
    <div role="menu" className={panel}>
      {items.map((rest, i) => (
        <div
          key={rest.title}
          role="menuitem"
          data-highlighted={i === 0 ? "" : undefined}
          className={item}
        >
          <ItemContent {...rest} />
        </div>
      ))}
    </div>
  );
}
