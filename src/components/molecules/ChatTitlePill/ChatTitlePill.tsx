import type { ButtonHTMLAttributes } from "react";

import { Icon } from "@/components/atoms/Icon";
import { cx, focusRing } from "@/components/atoms/states";

// Figma: Design system › Chat title pill (103:29055). Opens the chat menu.

export function ChatTitlePill({
  className,
  children,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cx(
        "inline-flex h-control-md items-center gap-1-5 rounded-pill border border-glass-rim glass-strong px-4 type-chat-title-pill text-ink shadow-chat-title-pill",
        focusRing,
        className,
      )}
      {...props}
    >
      {children}
      <Icon
        name="arrow-down-01"
        className="size-chat-title-pill-icon text-ink-3"
      />
    </button>
  );
}
