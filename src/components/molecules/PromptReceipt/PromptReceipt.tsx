import { Icon } from "@/components/atoms/Icon";
import { cx } from "@/components/atoms/states";

// Figma: Design system › Prompt receipt (103:29070): what a prompt cost.

export interface PromptReceiptProps {
  /** e.g. "This prompt: 3 models · 2.6 credits · ≈ BDT 0.03". */
  summary: string;
  /** e.g. "Cheapest: Gemini (0.3 cr)". */
  detail?: string;
  className?: string;
}

export function PromptReceipt({
  summary,
  detail,
  className,
}: PromptReceiptProps) {
  return (
    <p
      className={cx(
        "flex h-prompt-receipt-height items-center gap-2",
        className,
      )}
    >
      <Icon name="coins-01" className="size-icon-sm text-ink-3" />
      <span className="type-prompt-receipt text-ink-2">{summary}</span>
      {detail && (
        <span className="type-prompt-receipt-secondary text-ink-3">
          {detail}
        </span>
      )}
    </p>
  );
}
