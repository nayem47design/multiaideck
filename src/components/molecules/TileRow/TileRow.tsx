import { cloneElement, type ReactElement, type ReactNode } from "react";

import { Icon, type IconName } from "@/components/atoms/Icon";
import { cx, focusRing } from "@/components/atoms/states";

// Figma: Prototype › M10 · Wallet › "Row · Spent this month" / "Row · Payment history" /
// "Row · Pay as you go": an icon tile, a title and a line of detail. The row is either a link
// (with a chevron) or carries one trailing action ("Upgrade Now").

export interface TileRowProps {
  icon: IconName;
  title: string;
  caption: string;
  /** Makes the whole row a link: an empty link element, e.g. <Link href="/wallet/payments" />. */
  link?: ReactElement<{ className?: string }>;
  /** A trailing text action instead of the chevron. */
  action?: { label: string; onClick?: () => void };
  className?: string;
}

const row =
  "flex min-h-m-row-min-h w-full items-center gap-3 rounded-m-row border border-line bg-surface px-m-row-pad-x py-m-row-pad-y text-left";

export function TileRow({
  icon,
  title,
  caption,
  link,
  action,
  className,
}: TileRowProps) {
  const content: ReactNode[] = [
    <span
      key="tile"
      className="flex size-m-tile shrink-0 items-center justify-center rounded-m-tile bg-canvas text-ink-2"
    >
      <Icon name={icon} className="size-icon-md" />
    </span>,
    <span key="text" className="flex min-w-0 flex-1 flex-col gap-0-5">
      <span className="type-m-row-title text-ink">{title}</span>
      <span className="type-ui text-ink-2">{caption}</span>
    </span>,
  ];

  if (link)
    return cloneElement(
      link,
      {
        className: cx(
          row,
          "transition-colors duration-fast ease-out hover:bg-canvas-deep",
          focusRing,
          className,
        ),
      },
      ...content,
      <Icon
        key="chevron"
        name="arrow-right-01"
        className="size-icon-md shrink-0 text-ink-2"
      />,
    );

  return (
    <div className={cx(row, className)}>
      {content}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className={cx(
            "flex min-h-12 shrink-0 items-center rounded-xs type-m-link text-blue hover:underline",
            focusRing,
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
