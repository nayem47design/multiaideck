import { Badge, type BadgeTone } from "@/components/atoms/Badge";
import { MetricChip } from "@/components/atoms/MetricChip";
import { cx } from "@/components/atoms/states";

// Figma: Design system › Receipt strip (28:8373): metric chips (time, tokens, credits) and a badge.

export interface ReceiptStripProps {
  metrics: string[];
  badge?: { tone: BadgeTone; label: string };
  className?: string;
}

export function ReceiptStrip({ metrics, badge, className }: ReceiptStripProps) {
  return (
    <div className={cx("flex flex-wrap items-center gap-1-5", className)}>
      {metrics.map((metric) => (
        <MetricChip key={metric}>{metric}</MetricChip>
      ))}
      {badge && <Badge tone={badge.tone}>{badge.label}</Badge>}
    </div>
  );
}
