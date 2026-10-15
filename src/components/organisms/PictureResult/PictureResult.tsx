import { cloneElement, type ReactElement } from "react";

import { Button } from "@/components/atoms/Button";
import { Icon, type IconName } from "@/components/atoms/Icon";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";
import {
  PicturePlaceholder,
  type PictureTone,
} from "@/components/molecules/PicturePlaceholder";

// Figma: Prototype › "Image studio · Picture ready" (desktop: back + title, the picture and a side
// column with the prompt, cost and four actions) and M22 · Picture ready (below 768px: the picture,
// a cost line, Save to phone + Share, Make another version; the screen's top bar holds the title).
// `pending` is the "making your picture" state (not in Figma): the picture shimmers and the
// actions wait.

export interface PictureResultAction {
  label: string;
  /** Below 768px, if different (e.g. "Save to phone"). */
  mobileLabel?: string;
  onClick?: () => void;
}

export interface PictureResultProps {
  title: string;
  /** Desktop back link: an empty link element, e.g. <Link href="/images" />. */
  back: { label: string; link: ReactElement<{ className?: string }> };
  tone: PictureTone;
  caption?: string;
  pending?: boolean;
  labels: {
    /** "Your picture is ready" (or "Making your picture…" while pending). */
    status: string;
    /** "“A cosy coffee shop sign…” · Drawing". */
    prompt: string;
    /** "40 credits (৳0.40)". */
    cost: string;
    /** "40 credits (৳0.40) · made by an image AI". */
    mobileCost: string;
  };
  download: PictureResultAction;
  share: PictureResultAction;
  another: PictureResultAction;
  useInChat: PictureResultAction;
  className?: string;
}

const buttonSize =
  "h-page-button-h! max-md:h-images-action-h-mobile! max-md:type-auth-button-mobile";

function ActionLabel({ action }: { action: PictureResultAction }) {
  if (!action.mobileLabel) return action.label;
  return (
    <>
      <span className="max-md:hidden">{action.label}</span>
      <span className="md:hidden">{action.mobileLabel}</span>
    </>
  );
}

function Action({
  action,
  icon,
  variant,
  disabled,
  className,
}: {
  action: PictureResultAction;
  icon: IconName;
  variant: "primary" | "secondary" | "tinted";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Button
      variant={variant}
      icon={icon}
      onClick={action.onClick}
      disabled={disabled}
      className={cx(
        buttonSize,
        variant === "tinted" && "border-transparent!",
        className,
      )}
    >
      <ActionLabel action={action} />
    </Button>
  );
}

export function PictureResult({
  title,
  back,
  tone,
  caption,
  pending = false,
  labels,
  download,
  share,
  another,
  useInChat,
  className,
}: PictureResultProps) {
  return (
    <section className={cx("flex flex-col gap-4", className)}>
      <header className="flex items-center gap-2 max-md:hidden">
        {cloneElement(
          back.link,
          {
            className: cx(
              "flex size-10 shrink-0 items-center justify-center rounded-pill text-ink",
              stateLayer,
              focusRing,
            ),
            "aria-label": back.label,
          } as { className: string },
          <Icon key="icon" name="arrow-left-01" className="size-icon-md" />,
        )}
        <h1 className="min-w-0 truncate type-images-title text-ink">{title}</h1>
      </header>
      <div className="flex flex-col gap-4 md:flex-row md:gap-6">
        <PicturePlaceholder
          tone={tone}
          caption={caption}
          pending={pending}
          role="img"
          aria-label={title}
          size="lg"
          className="md:max-w-images-picture-w md:min-w-0 md:flex-1 md:self-start"
        />
        <div className="flex flex-col gap-3 md:w-images-side-w md:shrink-0">
          <p
            aria-live="polite"
            className="type-images-ready text-ink max-md:hidden"
          >
            {labels.status}
          </p>
          <p className="type-ui text-ink-2 max-md:hidden">{labels.prompt}</p>
          <p className="flex items-center gap-1-5 type-ui text-ink-2">
            <Icon name="coins-01" className="size-icon-sm" />
            <span className="max-md:hidden">{labels.cost}</span>
            <span className="md:hidden">{labels.mobileCost}</span>
          </p>
          <div className="flex flex-col gap-3 max-md:mt-1 max-md:gap-images-action-gap">
            <div className="flex flex-col gap-3 max-md:flex-row max-md:gap-images-action-gap">
              <Action
                action={download}
                icon="arrow-down-01"
                variant="primary"
                disabled={pending}
                className="max-md:flex-1"
              />
              <Action
                action={share}
                icon="share-01"
                variant="secondary"
                disabled={pending}
                className="max-md:flex-1"
              />
            </div>
            <Action
              action={another}
              icon="reload"
              variant="tinted"
              disabled={pending}
            />
            <Action
              action={useInChat}
              icon="bubble-chat"
              variant="secondary"
              disabled={pending}
              className="max-md:hidden"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
