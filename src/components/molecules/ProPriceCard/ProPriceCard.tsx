import { Icon } from "@/components/atoms/Icon";
import { cx } from "@/components/atoms/states";

// Figma: Prototype › M37 · Go Pro › "Pro card": plan name, monthly price and who it is for.

export interface ProPriceCardProps {
  name: string;
  /** e.g. "৳1,599". */
  price: string;
  /** e.g. "a month". */
  period: string;
  tagline: string;
  className?: string;
}

export function ProPriceCard({
  name,
  price,
  period,
  tagline,
  className,
}: ProPriceCardProps) {
  return (
    <section
      className={cx(
        "flex flex-col gap-1-5 rounded-lg bg-blue-soft p-5",
        className,
      )}
    >
      <h2 className="flex items-center gap-2 type-m-button text-blue">
        <Icon name="crown" className="size-go-pro-crown shrink-0" />
        {name}
      </h2>
      <p className="flex items-end gap-1-5 pt-1-5">
        <span className="type-m-pro-price text-ink">{price}</span>
        <span className="type-ui text-ink-2">{period}</span>
      </p>
      <p className="pt-1-5 type-ui text-ink">{tagline}</p>
    </section>
  );
}
