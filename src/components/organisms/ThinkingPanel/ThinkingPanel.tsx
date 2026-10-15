import { Icon } from "@/components/atoms/Icon";
import { ModelOrb } from "@/components/atoms/ModelOrb";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";
import { ThinkingDots } from "@/components/atoms/ThinkingDots";
import { AiOrbGroup } from "@/components/molecules/AiOrbGroup";
import type { ModelId } from "@/lib/ai/models";

// Not a Figma component yet: drawn on the screens "Thinking · Best answer" (Thinking card) and
// M20 / M26 / M30 (mobile). While the AIs write, one row per model shows its status; Stop ends the
// wait and only finished answers are charged.
//   layout "card": the desktop card with the Stop footer inside it.
//   layout "mobile": the M-screen block; render <ThinkingStop> at the bottom of the screen.

export type ThinkingStatus =
  "done" | "writing" | "slow" | "unresponsive" | "catching-up";

export interface ThinkingRow {
  model: ModelId;
  /** e.g. "Gemini 3 Flash" (desktop) or "Gemini" (mobile). */
  name: string;
  status: ThinkingStatus;
  /** e.g. "Done in 0.9 s", "Writing…", "Not responding". */
  statusLabel: string;
}

export interface ThinkingPanelProps {
  layout?: "card" | "mobile";
  /** e.g. "Asking 3 AIs…". */
  title: string;
  body: string;
  rows: ThinkingRow[];
  /** Card layout only. */
  stopLabel?: string;
  stopNote?: string;
  onStop?: () => void;
  className?: string;
}

function StatusEnd({ row }: { row: ThinkingRow }) {
  if (row.status === "done")
    return (
      <Icon name="tick-02" className="size-icon-button-icon text-success" />
    );
  if (row.status === "unresponsive")
    return (
      <Icon name="alert-circle" className="size-icon-button-icon text-error" />
    );
  // The row's label already says what is happening; the dots are decoration.
  return <ThinkingDots label="" aria-hidden role={undefined} />;
}

function Row({ row, mobile }: { row: ThinkingRow; mobile: boolean }) {
  return (
    <li
      className={cx(
        "flex items-center gap-3",
        mobile
          ? "h-chat-m-thinking-row px-3"
          : "h-chat-thinking-row rounded-chat-thinking-row bg-canvas px-4",
      )}
    >
      <ModelOrb model={row.model} size="md" />
      <span
        className={cx(
          "shrink-0 text-ink",
          mobile ? "type-chat-m-strong" : "type-chat-thinking-model",
        )}
      >
        {row.name}
      </span>
      <span className="flex-1" />
      <span
        className={cx(
          "min-w-0 truncate type-ui",
          row.status === "done" && "text-success",
          row.status === "unresponsive" && mobile && "text-error",
          row.status !== "done" &&
            !(row.status === "unresponsive" && mobile) &&
            "text-ink-2",
        )}
      >
        {row.statusLabel}
      </span>
      <StatusEnd row={row} />
    </li>
  );
}

export interface ThinkingStopProps {
  label: string;
  note?: string;
  onStop?: () => void;
  /** "card": compact pill with the note beside it; "mobile": full-width with the note below. */
  layout?: "card" | "mobile";
  className?: string;
}

export function ThinkingStop({
  label,
  note,
  onStop,
  layout = "mobile",
  className,
}: ThinkingStopProps) {
  const mobile = layout === "mobile";
  return (
    <div
      className={cx(
        "flex gap-3",
        mobile ? "flex-col items-center gap-2" : "items-center",
        className,
      )}
    >
      <button
        type="button"
        onClick={onStop}
        className={cx(
          "inline-flex items-center justify-center gap-2 rounded-pill border border-line bg-surface text-ink",
          mobile
            ? "h-chat-m-button w-full type-chat-m-name"
            : "h-control-lg px-chat-stop-pad type-ui-strong",
          stateLayer,
          focusRing,
        )}
      >
        <Icon
          name="stop"
          className={mobile ? "size-icon-md" : "size-icon-button-icon"}
        />
        {label}
      </button>
      {note && (
        <p className={cx("type-ui text-ink-2", mobile && "text-center")}>
          {note}
        </p>
      )}
    </div>
  );
}

export function ThinkingPanel({
  layout = "card",
  title,
  body,
  rows,
  stopLabel,
  stopNote,
  onStop,
  className,
}: ThinkingPanelProps) {
  const mobile = layout === "mobile";
  return (
    <section
      aria-live="polite"
      aria-busy={rows.some((r) => r.status !== "done")}
      className={cx(
        "flex w-full flex-col",
        mobile
          ? "gap-chat-m-thinking-gap"
          : "gap-4 rounded-xl border border-line bg-surface p-chat-thinking-pad",
        className,
      )}
    >
      {mobile ? (
        <>
          <AiOrbGroup size="md" className="self-start" />
          <h2 className="type-heading text-ink">{title}</h2>
          <p className="type-body text-ink-2">{body}</p>
        </>
      ) : (
        <header className="flex items-center gap-3">
          <AiOrbGroup size="sm" />
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="type-chat-thinking-title text-ink">{title}</h2>
            <p className="type-ui text-ink-2">{body}</p>
          </div>
        </header>
      )}
      <ul
        className={cx(
          "flex flex-col",
          mobile ? "rounded-lg border border-line bg-surface p-1" : "gap-4",
        )}
      >
        {rows.map((row) => (
          <Row key={row.model} row={row} mobile={mobile} />
        ))}
      </ul>
      {!mobile && stopLabel && (
        <ThinkingStop
          layout="card"
          label={stopLabel}
          note={stopNote}
          onStop={onStop}
        />
      )}
    </section>
  );
}
