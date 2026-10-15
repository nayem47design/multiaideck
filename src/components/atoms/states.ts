// Interaction states shared by every interactive atom. Figma has no hover, pressed or focus
// states yet; these are built from tokens and listed for the designer.

/** Hover and pressed tint the element with its own foreground colour (8% / 14%). */
export const stateLayer = [
  "relative isolate overflow-hidden",
  "after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:bg-current after:opacity-0",
  "after:transition-opacity after:duration-fast after:ease-out",
  "enabled:hover:after:opacity-8 enabled:active:after:opacity-14",
].join(" ");

/** Keyboard focus: 2px lum/blue outline, 2px away from the element. */
export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue";

export const cx = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");
