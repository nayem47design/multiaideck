import { Icon, type IconName } from "@/components/atoms/Icon";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";

// Not a Figma component yet: "Starter · …" rows on M2 · Home ("Not sure what to ask? Try one").
// The mobile counterpart of the Home hero's starter cards.

export interface StarterRowProps {
  icon: IconName;
  title: string;
  description: string;
  onClick?: () => void;
  className?: string;
}

export function StarterRow({
  icon,
  title,
  description,
  onClick,
  className,
}: StarterRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "flex min-h-16 w-full items-center gap-3 rounded-chat-m-starter border border-line bg-surface px-3 py-2 text-left",
        stateLayer,
        focusRing,
        className,
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-chat-m-tile bg-blue-soft text-blue">
        <Icon name={icon} className="size-icon-md" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0-5">
        <span className="type-chat-m-strong text-ink">{title}</span>
        <span className="type-ui text-ink-2">{description}</span>
      </span>
      <Icon
        name="arrow-right-01"
        className="size-icon-md shrink-0 text-ink-3"
      />
    </button>
  );
}
