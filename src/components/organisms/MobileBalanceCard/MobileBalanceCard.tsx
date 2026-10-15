import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { cx } from "@/components/atoms/states";

// Figma: Prototype › M10 · Wallet › "Balance": the balance in credits and taka, the "never
// expire" chip and the Add credits button.

export interface MobileBalanceCardProps {
  /** e.g. "Your balance". */
  label: string;
  /** e.g. "10,684 credits". */
  value: string;
  /** e.g. "About ৳106.84 · enough for about 410 questions". */
  caption: string;
  /** e.g. "Credits never expire". */
  chip?: string;
  action: { label: string; onClick?: () => void };
  className?: string;
}

export function MobileBalanceCard({
  label,
  value,
  caption,
  chip,
  action,
  className,
}: MobileBalanceCardProps) {
  return (
    <section
      className={cx(
        "flex flex-col gap-m-card-gap rounded-lg border border-line bg-surface p-5",
        className,
      )}
    >
      <h2 className="type-ui-strong text-ink-2">{label}</h2>
      <p className="type-m-balance-value text-ink">{value}</p>
      <p className="type-ui text-ink-2">{caption}</p>
      {chip && (
        <span className="inline-flex h-m-chip-h items-center gap-1-5 self-start rounded-pill bg-status-success-soft px-m-chip-pad type-m-chip text-success">
          <Icon name="tick-02" className="size-m-chip-icon" />
          {chip}
        </span>
      )}
      <Button
        size="touch"
        icon="add-01"
        iconSize="lg"
        className="w-full"
        onClick={action.onClick}
      >
        {action.label}
      </Button>
    </section>
  );
}
