import { ModelOrb } from "@/components/atoms/ModelOrb";
import { cx, focusRing } from "@/components/atoms/states";
import type { ModelId } from "@/lib/ai/models";

// Not a Figma component yet: "Model tabs" on mobile Compare (M6, M8, M23…M33): one tab per AI
// with a status caption ("Suggested", "0.9 cr", "Didn’t answer"). The selected tab is raised with
// a 1.5px border, red when that AI failed.

export type ModelTabTone = "neutral" | "info" | "success" | "error";

export interface ModelTab {
  value: string;
  model: ModelId;
  /** e.g. "Claude". */
  name: string;
  /** e.g. "Suggested", "0.9 cr", "Didn’t answer". */
  caption: string;
  tone?: ModelTabTone;
  /** Id of the panel the tab shows (aria-controls). */
  panelId?: string;
}

export interface ModelTabsProps {
  /** Accessible name of the tab list, e.g. "Answers". */
  label: string;
  tabs: ModelTab[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

const captionTone: Record<ModelTabTone, string> = {
  neutral: "text-ink-2",
  info: "text-blue",
  success: "text-success",
  error: "text-error",
};

export function ModelTabs({
  label,
  tabs,
  value,
  onValueChange,
  className,
}: ModelTabsProps) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cx("grid auto-cols-fr grid-flow-col gap-2", className)}
    >
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={tab.panelId}
            tabIndex={selected ? 0 : -1}
            onClick={() => onValueChange(tab.value)}
            onKeyDown={(e) => {
              const i = tabs.indexOf(tab);
              const step =
                e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
              if (!step) return;
              e.preventDefault();
              const next = tabs[(i + step + tabs.length) % tabs.length];
              onValueChange(next.value);
              const list = e.currentTarget.parentElement;
              (
                list?.children[tabs.indexOf(next)] as HTMLElement | undefined
              )?.focus();
            }}
            className={cx(
              "flex min-h-chat-m-tab-height min-w-0 flex-col items-start justify-center gap-0-5 rounded-md px-chat-m-tab-pad-x py-2 text-left ring-inset",
              "transition-colors duration-fast ease-out",
              selected
                ? cx(
                    "bg-surface ring-(length:--chat-m-selected-width)",
                    tab.tone === "error" ? "ring-error" : "ring-blue",
                  )
                : "ring-1 ring-line",
              focusRing,
            )}
          >
            <span className="flex max-w-full items-center gap-1-5">
              <ModelOrb model={tab.model} size="sm" />
              <span className="truncate type-ui-strong text-ink">
                {tab.name}
              </span>
            </span>
            <span
              className={cx(
                "max-w-full truncate type-caption",
                captionTone[tab.tone ?? "neutral"],
              )}
            >
              {tab.caption}
            </span>
          </button>
        );
      })}
    </div>
  );
}
