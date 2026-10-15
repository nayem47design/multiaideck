import type { ReactNode } from "react";

import { Icon, type IconName } from "@/components/atoms/Icon";
import { cx } from "@/components/atoms/states";

// Figma: Prototype › M13 · Usage › "Tip" and M41 · Privacy & security › "Your data": a blue-soft
// card with an icon, a blue title and a line of body text.

export interface TipCardProps {
  icon: IconName;
  title: string;
  children: ReactNode;
  className?: string;
}

export function TipCard({ icon, title, children, className }: TipCardProps) {
  return (
    <section
      className={cx(
        "flex flex-col gap-2 rounded-lg bg-blue-soft p-acct-card-pad",
        className,
      )}
    >
      <h2 className="flex items-center gap-2 type-acct-card-title text-blue">
        <Icon name={icon} className="size-icon-md shrink-0" />
        {title}
      </h2>
      <p className="type-ui text-ink">{children}</p>
    </section>
  );
}
