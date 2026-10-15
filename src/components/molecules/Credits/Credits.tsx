import { Progress } from "radix-ui";
import { cloneElement, type ReactElement } from "react";

import { Icon } from "@/components/atoms/Icon";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";

// Figma: Design system › Credits (245:28812), the sidebar's balance:
//   State=Collapsed: a bar with the balance, "Top up" and a chevron (up) that unfolds it.
//   State=Expanded:  a card with the balance, ≈ BDT, the share of the last top-up left, a Top up
//                    button and Go Pro; the chevron (down) folds it again.
// Figma's prototype only switches Collapsed → Expanded (the Expanded toggle points at itself);
// here the chevron toggles both ways.

type LinkElement = ReactElement<{ className?: string }>;

export interface CreditsProps {
  /** Figma State. */
  state?: "collapsed" | "expanded";
  onToggle?: () => void;
  expandLabel: string;
  collapseLabel: string;
  /** e.g. "10,684 credits". */
  balance: string;
  /** e.g. "≈ BDT 106.84". */
  money: string;
  /** 0–100: the share of the last top-up left. */
  progress: number;
  progressLabel: string;
  topUp: { label: string; onClick?: () => void };
  /** Shown when expanded. `link` is an empty <a>, <Link> or <button>. */
  goPro: { label: string; link: LinkElement };
  /** id of the card, for the toggle's aria-controls. */
  id?: string;
  className?: string;
}

export function Credits({
  state = "collapsed",
  onToggle,
  expandLabel,
  collapseLabel,
  balance,
  money,
  progress,
  progressLabel,
  topUp,
  goPro,
  id,
  className,
}: CreditsProps) {
  const expanded = state === "expanded";
  const value = Math.min(100, Math.max(0, progress));

  const flash = (
    <Icon name="flash" className="size-credits-icon shrink-0 text-blue" />
  );
  const amount = (
    <span className="truncate type-credits-balance text-ink">{balance}</span>
  );
  const toggle = (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={id}
      aria-label={expanded ? collapseLabel : expandLabel}
      onClick={onToggle}
      className={cx(
        "flex size-credits-toggle shrink-0 items-center justify-center rounded-pill text-ink-3",
        stateLayer,
        focusRing,
      )}
    >
      <Icon
        name={expanded ? "arrow-down-01" : "arrow-up-01"}
        className="size-credits-toggle-icon"
      />
    </button>
  );

  if (!expanded)
    return (
      <div
        id={id}
        className={cx(
          "flex h-credits-bar-height shrink-0 items-center gap-credits-gap rounded-pill bg-canvas-deep pr-credits-bar-pad-right pl-credits-bar-pad-left",
          className,
        )}
      >
        {flash}
        {amount}
        <span className="flex-1" />
        <button
          type="button"
          onClick={topUp.onClick}
          className={cx(
            "shrink-0 rounded-xs type-credits-top-up-link text-blue hover:underline",
            focusRing,
          )}
        >
          {topUp.label}
        </button>
        {toggle}
      </div>
    );

  return (
    <div
      id={id}
      className={cx(
        "flex shrink-0 flex-col gap-credits-card-gap rounded-credits-card bg-canvas-deep px-credits-card-pad pt-credits-card-pad-top pb-credits-card-pad",
        className,
      )}
    >
      <div className="flex h-credits-head-height items-center gap-credits-gap">
        {flash}
        {amount}
        <span className="flex-1" />
        {toggle}
      </div>
      <span className="type-credits-money text-ink-3">{money}</span>
      <Progress.Root
        value={value}
        aria-label={progressLabel}
        className="h-credits-progress-height w-full overflow-hidden rounded-credits-progress bg-blue-soft"
      >
        <Progress.Indicator
          className="h-full rounded-credits-progress bg-blue transition-[width] duration-slow ease-out"
          style={{ width: `${value}%` }}
        />
      </Progress.Root>
      <div className="flex items-center gap-credits-gap">
        <button
          type="button"
          onClick={topUp.onClick}
          className={cx(
            "flex h-credits-top-up-height shrink-0 items-center rounded-pill bg-blue px-credits-top-up-pad type-credits-top-up text-on-cta",
            stateLayer,
            focusRing,
          )}
        >
          {topUp.label}
        </button>
        <span className="flex-1" />
        {cloneElement(
          goPro.link,
          {
            className: cx(
              "inline-flex shrink-0 items-center gap-credits-go-pro-gap rounded-xs type-credits-go-pro text-ink",
              focusRing,
            ),
          },
          <Icon
            key="i"
            name="crown"
            className="size-credits-icon text-status-warning"
          />,
          goPro.label,
        )}
      </div>
    </div>
  );
}
