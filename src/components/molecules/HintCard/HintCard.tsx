import { Icon, type IconName } from "@/components/atoms/Icon";
import { cx } from "@/components/atoms/states";

// Figma: Prototype › M10 · Wallet › "How credits work": a tinted note with an icon and a title.

export interface HintCardProps {
  icon?: IconName;
  title: string;
  body: string;
  className?: string;
}

export function HintCard({
  icon = "information-circle",
  title,
  body,
  className,
}: HintCardProps) {
  return (
    <section
      className={cx(
        "flex flex-col gap-2 rounded-lg bg-blue-soft p-m-hint-pad",
        className,
      )}
    >
      <h2 className="flex items-center gap-2 type-m-row-title text-blue">
        <Icon name={icon} className="size-icon-md shrink-0" />
        {title}
      </h2>
      <p className="type-ui text-ink">{body}</p>
    </section>
  );
}
