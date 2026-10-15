import { cloneElement, type ReactElement } from "react";

import { Icon, type IconName } from "@/components/atoms/Icon";
import { cx, focusRing } from "@/components/atoms/states";

// Figma: Prototype › M15 · Account & settings › "Settings list" and M41 › "Rows" / "Danger": a
// card of 56px rows with an icon, a label, an optional value and a chevron. A row is a link or a
// button; the danger tone (Delete account) is red and has no chevron.

export interface AccountMenuItem {
  id: string;
  icon: IconName;
  label: string;
  /** Shown before the chevron, e.g. "English" or "26 credits this month". */
  value?: string;
  tone?: "default" | "danger";
  /** An empty link element, e.g. <Link href="/settings/usage" />. */
  link?: ReactElement<{ className?: string }>;
  onClick?: () => void;
  /** Accessible state for rows that open something in place, e.g. a sheet. */
  "aria-haspopup"?: "dialog";
  /** For a button row that shows more below the list; turns the chevron down when open. */
  expanded?: boolean;
}

export interface AccountMenuListProps {
  items: AccountMenuItem[];
  className?: string;
}

const row = cx(
  "flex h-acct-row-height w-full items-center gap-3 rounded-md px-3 text-left",
  "transition-colors duration-fast ease-out hover:bg-canvas",
  focusRing,
);

export function AccountMenuList({ items, className }: AccountMenuListProps) {
  return (
    <ul
      className={cx(
        "flex flex-col rounded-lg border border-line bg-surface p-1",
        className,
      )}
    >
      {items.map((item) => {
        const danger = item.tone === "danger";
        const content = [
          <Icon
            key="icon"
            name={item.icon}
            className={cx(
              "size-acct-row-icon shrink-0",
              danger ? "text-error" : "text-ink-2",
            )}
          />,
          <span
            key="label"
            className={cx(
              "min-w-0 flex-1 truncate type-acct-row-label",
              danger ? "text-error" : "text-ink",
            )}
          >
            {item.label}
          </span>,
          item.value ? (
            <span key="value" className="shrink-0 type-ui text-ink-2">
              {item.value}
            </span>
          ) : null,
          danger ? null : (
            <Icon
              key="chevron"
              name={item.expanded ? "arrow-down-01" : "arrow-right-01"}
              className="size-acct-row-chevron shrink-0 text-ink"
            />
          ),
        ];
        return (
          <li key={item.id}>
            {item.link ? (
              cloneElement(item.link, { className: row }, ...content)
            ) : (
              <button
                type="button"
                onClick={item.onClick}
                aria-haspopup={item["aria-haspopup"]}
                aria-expanded={item.expanded}
                className={row}
              >
                {content}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
