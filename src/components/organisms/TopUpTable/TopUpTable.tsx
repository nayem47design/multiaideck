import { RadioGroup as RadixRadioGroup } from "radix-ui";

import { Icon } from "@/components/atoms/Icon";
import { Radio } from "@/components/atoms/Radio";
import { cx, focusRing } from "@/components/atoms/states";

// Figma: Design system › Top-up table (103:20863). Step 1 of the wallet: pick a credit pack.
// Figma's component is 367px wide but its columns need ~586px, so Figma clips them; this
// component clips the same way and shows every column when given room.

export interface TopUpPack {
  value: string;
  price: string;
  credits: string;
  /** e.g. "+10%"; omit for none. */
  bonus?: string;
  /** Shown when there is no bonus, e.g. "none". */
  noBonusLabel: string;
  /** Rough chats, e.g. "2,960". */
  chats: string;
  /** e.g. "Most chosen". */
  tag?: string;
}

export interface TopUpTableProps {
  /** e.g. "1   Choose an amount". */
  title: string;
  columns: { pay: string; get: string; bonus: string; chats: string };
  packs: TopUpPack[];
  value: string;
  onValueChange: (value: string) => void;
  custom: { label: string; onClick?: () => void };
  /** e.g. "Need more than BDT 2,499? Teams plan →". */
  teams?: { label: string; href: string };
  footnote?: string;
  className?: string;
}

const col = {
  pay: "w-top-up-col-pay",
  get: "w-top-up-col-get",
  bonus: "w-top-up-col-bonus",
  chats: "w-top-up-col-chats",
};

export function TopUpTable({
  title,
  columns,
  packs,
  value,
  onValueChange,
  custom,
  teams,
  footnote,
  className,
}: TopUpTableProps) {
  return (
    <section
      className={cx(
        "flex w-full flex-col overflow-hidden rounded-xl border border-line bg-surface px-2 pt-5 pb-2 shadow-stat-card",
        className,
      )}
    >
      <h2 className="px-4 pb-3 type-step-title whitespace-pre text-ink">
        {title}
      </h2>
      <div className="flex h-control-sm items-center py-2 pr-4 pl-14 whitespace-nowrap">
        {(Object.keys(col) as (keyof typeof col)[]).map((k) => (
          <span
            key={k}
            className={cx("shrink-0 type-overline text-ink-3", col[k])}
          >
            {columns[k]}
          </span>
        ))}
      </div>
      <RadixRadioGroup.Root
        value={value}
        onValueChange={onValueChange}
        aria-label={title}
        className="flex flex-col"
      >
        {packs.map((pack) => (
          <label
            key={pack.value}
            className={cx(
              // Figma's selected row stroke sits inside without moving the content: an inset ring.
              "flex h-pack-row-height cursor-pointer items-center rounded-pack-row px-4 whitespace-nowrap",
              "has-data-[state=checked]:bg-blue-soft has-data-[state=checked]:ring-1 has-data-[state=checked]:ring-blue has-data-[state=checked]:ring-inset",
            )}
          >
            <Radio value={pack.value} />
            <span className="w-4 shrink-0" />
            <span
              className={cx("shrink-0 type-top-up-price text-ink", col.pay)}
            >
              {pack.price}
            </span>
            <span className={cx("shrink-0 type-stepper text-ink", col.get)}>
              {pack.credits}
            </span>
            <span className={cx("shrink-0", col.bonus)}>
              {pack.bonus ? (
                <span className="rounded-pill bg-status-success-soft px-2 py-0-5 type-stat-chip text-success">
                  {pack.bonus}
                </span>
              ) : (
                <span className="type-dialog-summary-label text-ink-3">
                  {pack.noBonusLabel}
                </span>
              )}
            </span>
            <span className={cx("shrink-0 type-stepper text-ink-2", col.chats)}>
              {pack.chats}
            </span>
            <span className="flex-1" />
            {pack.tag && (
              <span className="rounded-pill bg-blue px-3 py-1 type-stat-chip text-on-cta">
                {pack.tag}
              </span>
            )}
          </label>
        ))}
      </RadixRadioGroup.Root>
      <div className="flex h-top-up-custom-height items-center gap-2 px-4 whitespace-nowrap">
        <button
          type="button"
          onClick={custom.onClick}
          className={cx(
            "inline-flex items-center gap-2 rounded-xs type-order-summary-label text-ink-2",
            focusRing,
          )}
        >
          <Icon name="add-01" className="size-icon-sm text-ink-3" />
          {custom.label}
        </button>
        <span className="flex-1" />
        {teams && (
          <a
            href={teams.href}
            className={cx(
              "rounded-xs type-label text-blue hover:underline",
              focusRing,
            )}
          >
            {teams.label}
          </a>
        )}
      </div>
      {footnote && (
        <p className="px-4 pt-1 pb-2 type-caption whitespace-nowrap text-ink-3">
          {footnote}
        </p>
      )}
    </section>
  );
}
