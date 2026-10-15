import type { ReactNode } from "react";

import { Icon, type IconName } from "@/components/atoms/Icon";
import { cx } from "@/components/atoms/states";

// Figma: Design system › Empty state (103:20667). The action is a Button (Secondary, sm) in Figma.

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon = "bubble-chat",
  title,
  body,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cx(
        "flex w-full flex-col items-center gap-3 rounded-lg bg-canvas p-8 text-center",
        className,
      )}
    >
      <span className="flex size-empty-state-icon-circle items-center justify-center rounded-pill bg-blue-soft text-blue">
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
