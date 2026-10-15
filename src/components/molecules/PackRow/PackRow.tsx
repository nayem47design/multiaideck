import { Badge } from "@/components/atoms/Badge";
import { Radio } from "@/components/atoms/Radio";
import { cx } from "@/components/atoms/states";

// Figma: Design system › Pack row (28:8386). Figma shows the selected row; the unselected look
// (surface + line) is built from tokens. Use inside a <RadioGroup>.

export interface PackRowProps {
  value: string;
  price: string;
  credits: string;
  /** Bonus badge, e.g. "+10%". */
  bonus?: string;
  /** Rough usage, e.g. "2,960 chats". */
  usage?: string;
  className?: string;
}

export function PackRow({
  value,
  price,
  credits,
  bonus,
  usage,
  className,
}: PackRowProps) {
  return (
    <label
      className={cx(
        "flex h-pack-row-height w-full cursor-pointer items-center gap-4 rounded-pack-row border border-line bg-surface px-4",
        "transition-colors duration-fast ease-out",
        "has-data-[state=checked]:border-blue has-data-[state=checked]:bg-blue-soft",
        className,
      )}
    >
      <Radio value={value} />
      <span className="type-pack-row-price text-ink">{price}</span>
      <span className="type-pack-row-credits text-ink">{credits}</span>
      {bonus && <Badge tone="success">{bonus}</Badge>}
      {usage && (
        <span className="type-pack-row-credits text-ink-2">{usage}</span>
      )}
    </label>
  );
}
