import { cx } from "@/components/atoms/states";

// Not a Figma component yet: the "Pager" under the answer on mobile Compare (M6, M8…): one dot
// per answer, the current one long and blue, and a hint ("Swipe for the next answer").

export interface AnswerPagerProps {
  count: number;
  index: number;
  hint?: string;
  /** Accessible text, e.g. "Answer 1 of 3". */
  label: string;
  className?: string;
}

export function AnswerPager({
  count,
  index,
  hint,
  label,
  className,
}: AnswerPagerProps) {
  return (
    <div className={cx("flex items-center justify-center gap-1-5", className)}>
      <span role="img" aria-label={label} className="flex items-center gap-1-5">
        {Array.from({ length: count }, (_, i) => (
          <span
            key={i}
            className={cx(
              "h-2 rounded-pill transition-all duration-base ease-out",
              i === index ? "w-5 bg-blue" : "w-2 bg-line",
            )}
          />
        ))}
      </span>
      {hint && <span className="pl-1-5 type-ui text-ink-2">{hint}</span>}
    </div>
  );
}
