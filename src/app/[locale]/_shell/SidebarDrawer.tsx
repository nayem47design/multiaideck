"use client";

import { Dialog } from "radix-ui";
import { useTranslations } from "next-intl";

import { AppSidebar } from "./AppSidebar";

// 768–1023px: the collapsed rail is always on screen; Expand opens the full sidebar as a drawer
// over the page. (Figma: Sidebar State=Collapsed note; the tablet drawer needs designer sign-off.)

export function SidebarDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("nav");
  const close = () => onOpenChange(false);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay-scrim lg:hidden" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-shell-pad left-shell-pad z-50 flex outline-none lg:hidden"
        >
          <Dialog.Title className="sr-only">{t("expand")}</Dialog.Title>
          <AppSidebar collapsed={false} onNavigate={close} onToggle={close} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
