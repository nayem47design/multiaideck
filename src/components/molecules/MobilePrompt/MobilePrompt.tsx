import { cx } from "@/components/atoms/states";

// Not a Figma component yet: how mobile chat screens show your prompt. "bubble": the "You" card
// on M5 / M20 (right-aligned, surface, 20px corners); "line": "You asked: …" above the model tabs
// on mobile Compare (M6, M8…).

export interface MobilePromptProps {
  variant?: "bubble" | "line";
  prompt: string;
  /** "line" only, e.g. "You asked:". */
  label?: string;
  className?: string;
}

export function MobilePrompt({
  variant = "bubble",
  prompt,
  label,
  className,
}: MobilePromptProps) {
  if (variant === "line")
    return (
      <p className={cx("flex min-w-0 items-center gap-1-5 type-ui", className)}>
        <span className="shrink-0 text-ink-2">{label}</span>
        <span className="min-w-0 truncate text-ink">{prompt}</span>
      </p>
    );
  return (
    <p
      className={cx(
        "ml-auto w-fit max-w-chat-m-bubble rounded-lg border border-line bg-surface px-4 py-3 type-body text-ink",
        className,
      )}
    >
      {prompt}
    </p>
  );
}
