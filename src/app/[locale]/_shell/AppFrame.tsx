"use client";

import type { ReactNode } from "react";

import { AppShell } from "@/components/templates/AppShell";

import { AppSidebar } from "./AppSidebar";
import { MobileTabs } from "./MobileTabs";
import { SidebarDrawer } from "./SidebarDrawer";

/** Screens with the sidebar (Home, chats, Chats, Image studio, Presets). Pages render <AppMain>. */
export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <>
      <AppShell sidebar={<AppSidebar />}>{children}</AppShell>
      <SidebarDrawer />
      <MobileTabs />
    </>
  );
}
