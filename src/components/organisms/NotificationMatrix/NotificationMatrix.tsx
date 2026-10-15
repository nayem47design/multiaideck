import type { ReactNode } from "react";

import { Icon } from "@/components/atoms/Icon";
import { Toggle } from "@/components/atoms/Toggle";
import { cx } from "@/components/atoms/states";

// Figma: Design system › Notification matrix (103:21145): notification types × channels.
// Figma's toggles here are drawn shapes with a knob shadow; this uses the Toggle atom (no knob
// shadow in Figma's Toggle). Locked rows show the toggle at Figma's 55%.

export interface NotificationChannel {
  id: string;
  label: string;
}

export interface NotificationType {
  id: string;
  title: string;
  help: string;
  /** e.g. "Always on"; locks every channel on. */
  lockedLabel?: string;
  /** Channel id → on. */
  values: Record<string, boolean>;
  /** Extra controls under the row, e.g. the low-balance threshold. */
  extra?: ReactNode;
}

export interface NotificationMatrixProps {
  channels: NotificationChannel[];
  groups: { label: string; types: NotificationType[] }[];
  onChange: (typeId: string, channelId: string, on: boolean) => void;
  className?: string;
}

export function NotificationMatrix({
  channels,
  groups,
  onChange,
  className,
}: NotificationMatrixProps) {
  return (
    <section
      className={cx(
        "flex w-full flex-col rounded-xl border border-line bg-surface px-2 pt-2 pb-3 shadow-stat-card",
        className,
      )}
    >
      <div className="flex px-4 py-3">
        <span className="flex-1" />
        {channels.map((c) => (
          <span
            key={c.id}
            className="flex w-notif-col justify-center type-overline text-ink-3"
          >
            {c.label}
          </span>
        ))}
      </div>
      {groups.map((group, g) => (
        <div key={group.label} className="flex flex-col">
          <h3
            className={cx(
              "px-4 pb-1 type-group-label text-ink-3",
              g === 0 ? "pt-1" : "pt-5",
            )}
          >
            {group.label}
          </h3>
          {group.types.map((type) => (
            <div
              key={type.id}
              className="flex flex-col gap-2 rounded-md px-4 py-3"
            >
              <div className="flex items-center">
                <div className="flex min-w-0 flex-1 flex-col gap-0-5">
                  <p className="flex items-center gap-2">
                    <span className="type-setting-row-title text-ink">
                      {type.title}
                    </span>
                    {type.lockedLabel && (
                      <span className="inline-flex items-center gap-1 rounded-pill bg-canvas px-2 py-0-5 type-model-list-row-tag text-ink-3">
                        <Icon name="square-lock-02" className="size-3" />
                        {type.lockedLabel}
                      </span>
                    )}
                  </p>
                  <p className="type-setting-row-help text-ink-3">
                    {type.help}
                  </p>
                </div>
                {channels.map((c) => (
                  <span key={c.id} className="flex w-notif-col justify-center">
                    <Toggle
                      aria-label={`${type.title} · ${c.label}`}
                      checked={type.lockedLabel ? true : type.values[c.id]}
                      disabled={!!type.lockedLabel}
                      onCheckedChange={(on) => onChange(type.id, c.id, on)}
                    />
                  </span>
                ))}
              </div>
              {type.extra}
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}
