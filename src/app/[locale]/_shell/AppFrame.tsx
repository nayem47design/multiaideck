"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import { AppShell } from "@/components/templates/AppShell";
import { useRouter } from "@/lib/i18n/navigation";
import { applySidebar, readSidebar } from "@/lib/sidebar";

import { AppSidebar } from "./AppSidebar";
import { MobileTabs } from "./MobileTabs";
import { SidebarDrawer } from "./SidebarDrawer";

/** Screens with the sidebar (Home, chats, Chats, Image studio, Presets). Pages render <AppMain>. */
export function AppFrame({ children }: { children: ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  const router = useRouter();

  // ≥ 1024px: collapse to the rail or expand, remembered on this device. 768–1023px: the rail
  // stays; the toggle opens or closes the full sidebar as a drawer.
  const toggle = useCallback(() => {
    if (matchMedia("(min-width: 64rem)").matches)
      applySidebar(readSidebar() === "collapsed" ? "expanded" : "collapsed");
    else setDrawer((open) => !open);
  }, []);

  // ⌘\ or Ctrl+\ toggles the sidebar, as its tooltip says; ⌘, or Ctrl+, opens Settings, as the
  // Account menu says.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "\\") {
        e.preventDefault();
        toggle();
      } else if (e.key === ",") {
        e.preventDefault();
        router.push("/settings/profile");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, router]);

  return (
    <>
      <AppShell sidebar={<AppSidebar collapsed="auto" onToggle={toggle} />}>
        {children}
      </AppShell>
      <SidebarDrawer open={drawer} onOpenChange={setDrawer} />
      <MobileTabs />
    </>
  );
}
