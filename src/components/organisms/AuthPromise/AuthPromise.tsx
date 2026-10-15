import { Icon } from "@/components/atoms/Icon";
import { ModelConstellation } from "@/components/atoms/ModelConstellation";
import { cx } from "@/components/atoms/states";

// Figma: Prototype › Desktop · Sign in › Promise (also on Enter code): the model constellation,
// the three-line promise, a short explainer and three ticked points. Desktop only.

export interface AuthPromiseProps {
  /** "One question.\nThree AIs.\nThe best answer." Line breaks are kept. */
  title: string;
  body: string;
  points: string[];
  className?: string;
}

export function AuthPromise({
  title,
  body,
  points,
  className,
}: AuthPromiseProps) {
  return (
    <section className={cx("flex w-auth-promise-w flex-col gap-6", className)}>
      <ModelConstellation />
      <h1 className="type-auth-hero whitespace-pre-line text-ink">{title}</h1>
      <p className="w-auth-promise-body-w max-w-full type-body text-ink-2">
        {body}
      </p>
      <ul className="flex flex-col gap-6">
        {points.map((p) => (
          <li
            key={p}
            className="flex items-center gap-auth-point-gap type-ui text-ink"
          >
            <Icon name="tick-02" className="size-icon-md text-success" />
            {p}
          </li>
        ))}
      </ul>
    </section>
  );
}
