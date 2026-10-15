import { Icon, type IconName } from "@/components/atoms/Icon";
import { cx, focusRing } from "@/components/atoms/states";

// Figma: Prototype › M36 · Payment history › "Payment · …": amount and status, the date, and one
// action (Download receipt or Try again).

export interface PaymentHistoryCardProps {
  /** e.g. "৳699 via bKash". */
  amount: string;
  status: { label: string; tone: "success" | "error" };
  /** e.g. "Today, 11:52 AM". */
  date: string;
  action?: { icon: IconName; label: string; onClick?: () => void };
  className?: string;
}

export function PaymentHistoryCard({
  amount,
  status,
  date,
  action,
  className,
}: PaymentHistoryCardProps) {
  return (
    <article
      className={cx(
        "flex flex-col gap-1-5 rounded-lg border border-line bg-surface p-m-row-pad-x",
        className,
      )}
    >
      <p className="flex items-center justify-between gap-3">
        <span className="type-m-history-amount text-ink">{amount}</span>
        <span
          className={cx(
            "inline-flex h-m-history-status-h shrink-0 items-center rounded-pill px-m-chip-pad type-m-chip",
            status.tone === "error"
              ? "bg-status-error-soft text-error"
              : "bg-status-success-soft text-success",
          )}
        >
          {status.label}
        </span>
      </p>
      <p className="type-ui text-ink-2">{date}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className={cx(
            // 20px tall in Figma; padded to a 48px touch target without moving the text.
            "-my-m-row-pad-x inline-flex min-h-12 items-center gap-1-5 self-start rounded-xs type-m-link text-blue hover:underline",
            focusRing,
          )}
        >
          <Icon name={action.icon} className="size-icon-sm" />
          {action.label}
        </button>
      )}
    </article>
  );
}
