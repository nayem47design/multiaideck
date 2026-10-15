import type { HTMLAttributes } from "react";

import { Icon } from "@/components/atoms/Icon";
import { cx } from "@/components/atoms/states";

// Figma: Design system › Toast (28:8409). Tone mirrors Figma. This is the toast's look; showing and
// dismissing toasts is wired in the app shell.

export type ToastTone = "success" | "error";

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  tone: ToastTone;
}

export function Toast({ tone, className, children, ...props }: ToastProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cx(
        "inline-flex h-12 items-center gap-2 rounded-pill border border-glass-rim glass-strong px-4 type-toast text-ink shadow-toast",
        className,
      )}
      {...props}
    >
      <Icon
        name={tone === "success" ? "tick-02" : "alert-circle"}
        className={cx(
          "size-toast-icon",
          tone === "success" ? "text-success" : "text-error",
        )}
      />
      {children}
    </div>
  );
}
