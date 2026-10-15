import { Icon, type IconName } from "@/components/atoms/Icon";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";

// Figma: Design system › Sidebar section header (245:28609): a section label ("Projects",
// "Today") with a fold chevron, and an optional action on the right ("＋" New project).
// The label and chevron are one button that folds or unfolds the section below it.

export interface SidebarSectionHeaderProps {
  label: string;
  /** false folds the section: the chevron turns to point right. */
  expanded?: boolean;
  onToggle?: () => void;
  /** id of the list this header folds, for aria-controls. */
  controls?: string;
  /** Figma "Add": shown at the end of the row. */
  action?: { icon?: IconName; label: string; onClick?: () => void };
  className?: string;
}

export function SidebarSectionHeader({
  label,
  expanded = true,
  onToggle,
  controls,
  action,
  className,
}: SidebarSectionHeaderProps) {
  return (
    <div
      className={cx(
        "flex h-section-header-height shrink-0 items-center gap-section-header-gap",
        "pt-section-header-pad-top pr-section-header-pad-right pb-section-header-pad-bottom pl-3",
        className,
      )}
    >
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={controls}
        onClick={onToggle}
        className={cx(
          "flex items-center gap-section-header-gap rounded-xs type-section-header text-ink-3",
          "transition-colors duration-fast ease-out hover:text-ink-2",
          focusRing,
        )}
      >
        {label}
        <Icon
          name="arrow-down-01"
          className={cx(
            "size-section-header-chevron transition-transform duration-fast ease-out",
            !expanded && "-rotate-90",
          )}
        />
      </button>
      <span className="flex-1" />
      {action && (
        <button
          type="button"
          aria-label={action.label}
          onClick={action.onClick}
          className={cx(
            "flex size-section-header-action shrink-0 items-center justify-center rounded-pill text-ink-3",
            stateLayer,
            focusRing,
          )}
        >
          <Icon
            name={action.icon ?? "add-01"}
            className="size-section-header-action-icon"
          />
        </button>
      )}
    </div>
  );
}
