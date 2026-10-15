import { Dialog } from "radix-ui";
import type { ReactNode } from "react";

// Figma: Design system › Template/Modal over app (28:9394): the screen, a scrim, and a centred
// dialog 520 to 1000px wide. Figma's scrim is lum/ink at full opacity; this uses overlay/scrim.

export interface ModalOverAppProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Accessible name when the dialog content has no Dialog.Title. */
  label?: string;
  /** The dialog panel. */
  children: ReactNode;
}

export function ModalOverApp({
  open,
  onOpenChange,
  label,
  children,
}: ModalOverAppProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay-scrim" />
        <Dialog.Content
          aria-label={label}
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 z-50 max-h-full max-w-full -translate-1/2 overflow-auto outline-none"
        >
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
