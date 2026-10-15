import { Icon } from "@/components/atoms/Icon";
import { cx } from "@/components/atoms/states";

// Figma: Prototype › M35 · Payment didn't go through › "Common reasons" (dots, with a title) and
// M37 · Go Pro › "What you get" (ticks).

export interface ChecklistCardProps {
  title?: string;
  items: string[];
  marker?: "dot" | "tick";
  className?: string;
}

export function ChecklistCard({
  title,
  items,
  marker = "dot",
  className,
}: ChecklistCardProps) {
  const tick = marker === "tick";
  return (
    <section
      className={cx(
        "flex flex-col rounded-lg border border-line bg-surface p-4",
        tick ? "gap-3" : "gap-2",
        className,
      )}
    >
      {title && <h2 className="type-m-row-title text-ink">{title}</h2>}
      <ul className={cx("flex flex-col", tick ? "gap-3" : "gap-2")}>
        {items.map((item) => (
          <li
            key={item}
            className={cx(
              "flex items-center type-ui",
              tick ? "gap-m-content-gap-sm text-ink" : "gap-2 text-ink-2",
            )}
          >
            {tick ? (
              <Icon
                name="tick-02"
                className="size-icon-md shrink-0 text-success"
              />
            ) : (
              <span className="size-1-5 shrink-0 rounded-pill bg-ink-2" />
            )}
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
