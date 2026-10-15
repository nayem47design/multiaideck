"use client";

import { Dialog } from "radix-ui";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { IconButton } from "@/components/atoms/IconButton";

import { AppSidebar } from "./AppSidebar";

// 768–1024px: the sidebar collapses behind a button and opens as a drawer over the page.
// (Not designed in Figma yet; the build guide asks for a designer sign-off.)

export function SidebarDrawer() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <IconButton
          variant="glass"
          icon="sidebar-left"
          label={t("openSidebar")}
          className="fixed top-shell-pad left-shell-pad z-20 max-md:hidden lg:hidden"
        />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay-scrim lg:hidden" />
        <Dialog.Content
          aria-label={t("openSidebar")}
          aria-describedby={undefined}
          className="fixed inset-y-shell-pad left-shell-pad z-50 flex outline-none lg:hidden"
        >
          <Dialog.Title className="sr-only">{t("openSidebar")}</Dialog.Title>
          <AppSidebar onNavigate={() => setOpen(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
