import { Icon, type IconName } from "@/components/atoms/Icon";
import { cx, focusRing } from "@/components/atoms/states";

import { TableCard, TableCell } from "../TableCard";

// Figma: Design system › Payments table (103:29333): top-ups and their status.

export interface PaymentRow {
  id: string;
  date: string;
  /** e.g. "BDT 2,499 via bKash". */
  topUp: string;
  status: { label: string; tone: "success" | "error" };
  /** Default icon: reload (Try again); e.g. download-01 for a receipt. */
  action?: { label: string; onClick?: () => void; icon?: IconName };
}

export interface PaymentsTableProps {
  columns: { date: string; topUp: string; status: string };
  rows: PaymentRow[];
  footnote?: string;
  className?: string;
}

const W = {
  date: "w-payments-col-date",
  topUp: "w-payments-col-top-up",
  status: "w-payments-col-status",
  action: "w-payments-col-action",
};

export function PaymentsTable({
  columns,
  rows,
  footnote,
  className,
}: PaymentsTableProps) {
  return (
    <TableCard
      className={className}
      footnote={footnote}
      columns={[
        { label: columns.date, width: W.date },
        { label: columns.topUp, width: W.topUp },
        { label: columns.status, width: W.status },
        { label: "", width: W.action },
      ]}
    >
      {rows.map((row) => (
        <div
          key={row.id}
          role="row"
          className="flex h-table-row-height items-center px-4"
        >
          <TableCell
            width={W.date}
            className="type-order-summary-label text-ink-2"
          >
            {row.date}
          </TableCell>
          <TableCell
            width={W.topUp}
            className="type-nav-item-selected text-ink"
          >
            {row.topUp}
          </TableCell>
          <TableCell width={W.status}>
            <span
              className={cx(
                "rounded-pill px-3 py-1 type-stat-chip",
                row.status.tone === "error"
                  ? "bg-status-error-soft text-error"
                  : "bg-status-success-soft text-success",
              )}
            >
              {row.status.label}
            </span>
          </TableCell>
          <TableCell width={W.action}>
            {row.action && (
              <button
                type="button"
                onClick={row.action.onClick}
                className={cx(
                  "inline-flex items-center gap-1-5 rounded-xs type-label text-blue hover:underline",
                  focusRing,
                )}
              >
                <Icon
                  name={row.action.icon ?? "reload"}
                  className="size-dialog-link-icon"
                />
                {row.action.label}
              </button>
            )}
          </TableCell>
        </div>
      ))}
    </TableCard>
  );
}
