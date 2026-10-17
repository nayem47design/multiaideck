import type { ReactNode } from "react";

import { Icon, type IconName } from "@/components/atoms/Icon";
import { cx } from "@/components/atoms/states";

// Figma: Design system › Empty state (298:56067): Tone=Empty (nothing to show yet, one next
// action) and Tone=Error (couldn't load, "Try again"). The action is a Button (Secondary, sm).

export interface EmptyStateProps {
  tone?: "empty" | "error";
  icon?: IconName;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  tone = "empty",
  icon = tone === "error" ? "alert-circle" : "bubble-chat",
  title,
  body,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={cx(
        "flex w-full flex-col items-center gap-3 rounded-lg bg-canvas p-8 text-center",
        className,
      )}
    >
      <span
        className={cx(
          "flex size-empty-state-icon-circle items-center justify-center rounded-pill",
          tone === "error"
            ? "bg-status-error-soft text-error"
            : "bg-blue-soft text-blue",
        )}
      >
        <Icon name={icon} className="size-empty-state-icon" />
      </span>
      <p className="type-empty-state-title text-ink">{title}</p>
      {body && (
        <p className="w-full type-empty-state-body text-ink-2">{body}</p>
      )}
      {action}
    </div>
  );
}
