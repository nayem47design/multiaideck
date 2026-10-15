import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { Input } from "@/components/atoms/Input";
import { cx, focusRing } from "@/components/atoms/states";

// Figma: Design system › Identity card (103:29216): photo, display name, email. Figma's inputs
// here are 48px tall (the Input atom is 46).

export interface IdentityCardProps {
  title: string;
  initials: string;
  name: string;
  changePhoto: { label: string; onClick?: () => void };
  /** e.g. "JPG or PNG, up to 2 MB". */
  photoHint: string;
  displayName: {
    label: string;
    value: string;
    onValueChange: (v: string) => void;
    help: string;
  };
  email: {
    label: string;
    value: string;
    verifiedLabel?: string;
    change: { label: string; onClick?: () => void };
    help: string;
  };
  /** Screens: below 768px, stack the fields and wrap the photo row (no Figma frame yet). */
  responsive?: boolean;
  className?: string;
}

export function IdentityCard({
  title,
  initials,
  name,
  changePhoto,
  photoHint,
  displayName,
  email,
  responsive = false,
  className,
}: IdentityCardProps) {
  return (
    <section
      className={cx(
        "flex w-full flex-col gap-4 rounded-xl border border-line bg-surface p-6 shadow-stat-card",
        responsive && "max-md:p-4",
        className,
      )}
    >
      <h2 className="type-step-title text-ink">{title}</h2>
      <div
        className={cx(
          "flex items-center gap-4",
          responsive && "max-md:flex-wrap max-md:gap-3",
        )}
      >
        <span
          role="img"
          aria-label={name}
          className="flex size-16 shrink-0 items-center justify-center rounded-pill bg-blue-soft type-identity-initials text-blue"
        >
          <span aria-hidden>{initials}</span>
        </span>
        <Button
          variant="secondary"
          size="sm"
          icon="camera-01"
          onClick={changePhoto.onClick}
        >
          {changePhoto.label}
        </Button>
        <span className="type-caption text-ink-3">{photoHint}</span>
      </div>
      <div className={cx("flex gap-4", responsive && "max-md:flex-col")}>
        <label className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="type-field-label text-ink-2">
            {displayName.label}
          </span>
          <Input
            heightClassName="h-12"
            value={displayName.value}
            onChange={(e) => displayName.onValueChange(e.target.value)}
          />
          <span className="type-caption text-ink-3">{displayName.help}</span>
        </label>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="type-field-label text-ink-2">{email.label}</span>
          <div className="flex h-12 items-center gap-2 overflow-hidden rounded-md bg-canvas px-4 ring-1 ring-line ring-inset">
            <span className="min-w-0 flex-1 truncate type-input text-ink-2">
              {email.value}
            </span>
            {email.verifiedLabel && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-pill bg-status-success-soft px-2 py-0-5 type-model-list-row-tag text-success">
                <Icon name="tick-02" className="size-3" />
                {email.verifiedLabel}
              </span>
            )}
            <button
              type="button"
              onClick={email.change.onClick}
              className={cx(
                "shrink-0 rounded-xs type-label text-blue hover:underline",
                focusRing,
              )}
            >
              {email.change.label}
            </button>
          </div>
          <span className="type-caption text-ink-3">{email.help}</span>
        </div>
      </div>
    </section>
  );
}
