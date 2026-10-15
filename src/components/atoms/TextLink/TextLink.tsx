import { Slot } from "radix-ui";
import type { AnchorHTMLAttributes, Ref } from "react";

import { Icon } from "../Icon/Icon";
import { cx, focusRing } from "../states";

// Figma: Design system › Text link (103:20556). Variant mirrors Figma's "Style".
// Use `asChild` to render a Next.js <Link>.

export type TextLinkVariant = "default" | "muted";

export interface TextLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: TextLinkVariant;
  /** Shows the external-link icon, as in Figma. */
  external?: boolean;
  asChild?: boolean;
  ref?: Ref<HTMLAnchorElement>;
}

export function TextLink({
  variant = "default",
  external = false,
  asChild = false,
  className,
  children,
  ref,
  ...props
}: TextLinkProps) {
  const Component = asChild ? Slot.Root : "a";
  return (
    <Component
      ref={ref}
      className={cx(
        "inline-flex items-center gap-1 rounded-xs type-text-link underline-offset-2 hover:underline",
        variant === "default" ? "text-blue" : "text-ink-2",
        focusRing,
        className,
      )}
      {...(external && !asChild ? { target: "_blank", rel: "noreferrer" } : {})}
      {...props}
    >
      <Slot.Slottable>{children}</Slot.Slottable>
      {external && (
        <Icon
          name="link-square-02"
          className={cx(
            "size-text-link-icon",
            variant === "muted" && "text-ink-3",
          )}
        />
      )}
    </Component>
  );
}
