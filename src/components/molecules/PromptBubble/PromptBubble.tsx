import type { HTMLAttributes } from "react";

import { cx } from "@/components/atoms/states";

// Figma: Design system › Prompt bubble (103:29047): the user's prompt, on glass.

export function PromptBubble({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        "inline-flex max-w-full rounded-xl border border-glass-rim glass-strong px-5 py-3 type-prompt-bubble text-ink shadow-prompt-bubble",
        className,
      )}
      {...props}
    />
  );
}
