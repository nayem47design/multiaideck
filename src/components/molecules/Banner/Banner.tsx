import { Icon, type IconName } from "@/components/atoms/Icon";
import { cx } from "@/components/atoms/states";

// Figma: Design system › Banner (103:20666). Tone mirrors Figma.

export type BannerTone = "info" | "warning" | "error";

export interface BannerProps {
  tone: BannerTone;
  title: string;
  body?: string;
  className?: string;
}

const tones: Record<BannerTone, { box: string; icon: string; name: IconName }> =
  {
    info: {
      box: "bg-blue-soft",
      icon: "text-blue",
      name: "information-circle",
    },
    warning: {
      box: "bg-status-warning-soft",
      icon: "text-status-warning",
      name: "alert-circle",
    },
    error: {
      box: "bg-status-error-soft",
      icon: "text-error",
      name: "alert-circle",
    },
  };

export function Banner({ tone, title, body, className }: BannerProps) {
  const t = tones[tone];
  return (
    <div
      role={tone === "info" ? "status" : "alert"}
      className={cx(
        "flex w-full items-center gap-3 rounded-md px-4 py-3",
        t.box,
        className,
      )}
    >
      <Icon name={t.name} className={cx("size-banner-icon", t.icon)} />
      <div className="flex min-w-0 flex-1 flex-col gap-0-5">
        <p className="type-banner-title text-ink">{title}</p>
        {body && <p className="type-banner-body text-ink-2">{body}</p>}
      </div>
    </div>
  );
}
