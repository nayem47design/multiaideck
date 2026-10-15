import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";

// Figma: Prototype › Overlay · Go Pro (166:28764): plan name and price, Pay as you go vs Pro,
// a note, and Not now / Upgrade. The dialog panel only; the overlay adds the scrim.

export interface GoProPlan {
  title: string;
  features: string[];
}

export interface GoProPanelProps {
  name: string;
  /** e.g. "৳1,599". */
  price: string;
  /** e.g. "a month". */
  period: string;
  tagline: string;
  plans: { payg: GoProPlan; pro: GoProPlan };
  note: string;
  closeLabel: string;
  notNowLabel: string;
  upgradeLabel: string;
  onClose?: () => void;
  onUpgrade?: () => void;
  /** Title element; a Dialog.Title when used in a dialog. */
  renderTitle?: (title: string) => React.ReactNode;
  className?: string;
}

function Plan({ plan, pro }: { plan: GoProPlan; pro?: boolean }) {
  return (
    <section
      className={cx(
        "flex min-w-0 flex-1 flex-col gap-2 rounded-go-pro-plan p-4",
        pro ? "border border-blue bg-blue-soft" : "bg-canvas",
      )}
    >
      <h3
        className={cx("type-go-pro-plan-title", pro ? "text-blue" : "text-ink")}
      >
        {plan.title}
      </h3>
      <ul className="flex flex-col gap-2">
        {plan.features.map((f) => (
          <li key={f} className="flex items-center gap-1-5 type-ui text-ink">
            <Icon
              name="tick-02"
              className={cx(
                "size-icon-sm shrink-0",
                pro ? "text-blue" : "text-ink-2",
              )}
            />
            {f}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function GoProPanel({
  name,
  price,
  period,
  tagline,
  plans,
  note,
  closeLabel,
  notNowLabel,
  upgradeLabel,
  onClose,
  onUpgrade,
  renderTitle,
  className,
}: GoProPanelProps) {
  return (
    <div
      className={cx(
        "flex w-go-pro-width max-w-full flex-col gap-go-pro-gap rounded-xl border border-line bg-surface p-go-pro-pad shadow-dialog",
        className,
      )}
    >
      <div className="flex h-10 items-center justify-between">
        <div className="flex items-center gap-2 type-heading text-ink">
          <Icon name="crown" className="size-go-pro-crown shrink-0 text-blue" />
          {renderTitle ? renderTitle(name) : <h2>{name}</h2>}
        </div>
        <button
          type="button"
          aria-label={closeLabel}
          title={closeLabel}
          onClick={onClose}
          className={cx(
            "flex size-10 items-center justify-center rounded-pill text-ink-2",
            stateLayer,
            focusRing,
          )}
        >
          <Icon name="cancel-01" className="size-icon-md" />
        </button>
      </div>
      <p className="flex items-end gap-2">
        <span className="type-go-pro-price text-ink">{price}</span>
        <span className="type-ui text-ink-2">{period}</span>
      </p>
      <p className="type-body text-ink-2">{tagline}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Plan plan={plans.payg} />
        <Plan plan={plans.pro} pro />
      </div>
      <p className="type-ui text-ink-2">{note}</p>
      <div className="flex items-center gap-go-pro-actions-gap">
        <button
          type="button"
          onClick={onClose}
          className={cx(
            "inline-flex h-12 shrink-0 items-center rounded-pill px-go-pro-button-pad type-go-pro-button text-ink",
            stateLayer,
            focusRing,
          )}
        >
          {notNowLabel}
        </button>
        <Button size="lg" className="min-w-0 flex-1" onClick={onUpgrade}>
          {upgradeLabel}
        </Button>
      </div>
    </div>
  );
}
