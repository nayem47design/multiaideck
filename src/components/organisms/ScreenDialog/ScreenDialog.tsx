import { Dialog } from "radix-ui";
import type { ReactNode } from "react";

import { LightField } from "@/components/atoms/LightField";

// A prototype overlay that is a centred dialog on desktop (Template/Modal over app, 28:9394) and a
// full screen below 768px, as the M-screens draw it (M37 · Go Pro, M38 · Pro is on). Pass both
// layouts; each is shown at its own width.

export interface ScreenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Accessible name of the dialog. */
  label: string;
  /** The dialog panel (≥ 768px). */
  desktop: ReactNode;
  /** The full screen (< 768px). */
  mobile: ReactNode;
}

export function ScreenDialog({
  open,
  onOpenChange,
  label,
  desktop,
  mobile,
}: ScreenDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay-scrim max-md:hidden" />
        <Dialog.Content
          aria-label={label}
          aria-describedby={undefined}
          className="fixed inset-0 z-50 overflow-auto bg-canvas outline-none md:inset-auto md:top-1/2 md:left-1/2 md:max-h-full md:max-w-full md:-translate-1/2 md:bg-transparent"
        >
          <div className="relative isolate flex min-h-dvh flex-col md:hidden">
            <LightField variant="mobile" />
            {mobile}
          </div>
          <div className="max-md:hidden">{desktop}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
