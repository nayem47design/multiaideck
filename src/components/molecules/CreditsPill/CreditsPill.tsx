import { cloneElement, type ReactElement } from "react";

import { Icon } from "@/components/atoms/Icon";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";

// Not a Figma component yet: "Credits pill" at the top of M2 · Home: the balance in credits and
// taka. It links to Wallet.

export interface CreditsPillProps {
  /** e.g. "10,684 credits". */
  credits: string;
  /** e.g. "৳106". */
  money: string;
  /** An empty link element, e.g. <Link href="/wallet" />. */
  link: ReactElement<{ className?: string }>;
  className?: string;
}

export function CreditsPill({
  credits,
  money,
  link,
  className,
}: CreditsPillProps) {
  return cloneElement(
    link,
    {
      className: cx(
        "inline-flex h-10 min-w-0 items-center gap-1-5 rounded-pill border border-line bg-surface px-3",
        stateLayer,
        focusRing,
        className,
      ),
    },
    <Icon
      key="icon"
      name="coins-01"
      className="size-icon-button-icon shrink-0 text-ink-2"
    />,
    <span key="credits" className="truncate type-chat-m-strong text-ink">
      {credits}
    </span>,
    <span key="money" className="type-input text-ink-2">
      {money}
    </span>,
  );
}
