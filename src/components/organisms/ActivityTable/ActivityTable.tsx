import { Fragment } from "react";

import { Icon } from "@/components/atoms/Icon";
import { ModelOrb } from "@/components/atoms/ModelOrb";
import { cx, focusRing } from "@/components/atoms/states";
import type { ModelId } from "@/lib/ai/models";

import { TableCard, TableCell } from "../TableCard";

// Figma: Design system › Activity table (103:21035): usage grouped by chat; an open row lists each
// model's share.

export interface ActivityRow {
  id: string;
  date: string;
  chat: string;
  models: ModelId[];
  /** e.g. "3 models". */
  modelsLabel: string;
  credits: string;
  money: string;
  breakdown: { model: ModelId; name: string; credits: string; money: string }[];
}

export interface ActivityTableProps {
  columns: {
    date: string;
    chat: string;
    models: string;
    credits: string;
    money: string;
  };
  rows: ActivityRow[];
  openId?: string;
  onToggle?: (id: string) => void;
  toggleLabel: (chat: string) => string;
  footnote?: string;
  className?: string;
}

const W = {
  date: "w-activity-col-date",
  chat: "w-activity-col-chat",
  models: "w-activity-col-models",
  credits: "w-activity-col-credits",
  money: "w-activity-col-money",
};

export function ActivityTable({
  columns,
  rows,
  openId,
  onToggle,
  toggleLabel,
  footnote,
  className,
}: ActivityTableProps) {
  return (
    <TableCard
      className={className}
      footnote={footnote}
      columns={(Object.keys(W) as (keyof typeof W)[]).map((k) => ({
        label: columns[k],
        width: W[k],
      }))}
    >
      {rows.map((row) => {
        const open = row.id === openId;
        return (
          <Fragment key={row.id}>
            <div
              role="row"
              className={cx(
                "flex h-table-row-height items-center rounded-table-row px-4",
                open && "bg-canvas",
              )}
            >
              <TableCell
                width={W.date}
                className="type-order-summary-label text-ink-2"
              >
                {row.date}
              </TableCell>
              <TableCell
                width={W.chat}
                className="type-nav-item-selected text-ink"
              >
                {row.chat}
              </TableCell>
              <TableCell width={W.models}>
                <span className="flex space-x-sidebar-chat-orb-overlap">
                  {row.models.map((m) => (
                    <ModelOrb
                      key={m}
                      model={m}
                      size="sm"
                      sizeClassName="size-usage-orb"
                      ringOutside
                    />
                  ))}
                </span>
                <span className="type-dialog-summary-label text-ink-2">
                  {row.modelsLabel}
                </span>
              </TableCell>
              <TableCell
                width={W.credits}
                className="type-table-number text-ink"
              >
                {row.credits}
              </TableCell>
              <TableCell
                width={W.money}
                className="type-table-number text-ink-2"
              >
                {row.money}
              </TableCell>
              <span className="flex-1" />
              <button
                type="button"
                aria-expanded={open}
                aria-label={toggleLabel(row.chat)}
                onClick={() => onToggle?.(row.id)}
                className={cx(
                  "rounded-pill text-ink-3 hover:text-ink",
                  focusRing,
                )}
              >
                <Icon
                  name={open ? "arrow-up-01" : "arrow-down-01"}
                  className="size-icon-sm"
                />
              </button>
            </div>
            {open &&
              row.breakdown.map((b) => (
                <div
                  key={b.model}
                  role="row"
                  className="flex h-table-subrow-height items-center px-4"
                >
                  <TableCell width={W.date} />
                  <TableCell width={W.chat} />
                  <TableCell
                    width={W.models}
                    className="type-dialog-summary-label text-ink-2"
                  >
                    <ModelOrb model={b.model} size="sm" ringOutside />
                    {b.name}
                  </TableCell>
                  <TableCell
                    width={W.credits}
                    className="type-table-number text-ink-2"
                  >
                    {b.credits}
                  </TableCell>
                  <TableCell
                    width={W.money}
                    className="type-table-number text-ink-2"
                  >
                    {b.money}
                  </TableCell>
                </div>
              ))}
          </Fragment>
        );
      })}
    </TableCard>
  );
}
