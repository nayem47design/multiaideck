// Shared story fixtures for the templates: real organisms with Figma's sample content, and a
// placeholder for Figma's purple "SLOT" frames. Stories only.

import type { ReactNode } from "react";

import { Composer, type ComposerProps } from "@/components/organisms/Composer";
import { OrderSummary } from "@/components/organisms/OrderSummary";
import { PageTopBar } from "@/components/organisms/PageTopBar";
import { SettingsNav } from "@/components/organisms/SettingsNav";
import { Sidebar } from "@/components/organisms/Sidebar";
import SidebarStories from "@/components/organisms/Sidebar/Sidebar.stories";
import ComposerStories from "@/components/organisms/Composer/Composer.stories";
import OrderSummaryStories from "@/components/organisms/OrderSummary/OrderSummary.stories";
import PageTopBarStories from "@/components/organisms/PageTopBar/PageTopBar.stories";
import SettingsNavStories from "@/components/organisms/SettingsNav/SettingsNav.stories";
import type { SidebarProps } from "@/components/organisms/Sidebar";

export function Slot({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      data-slot
      className={`flex items-center justify-center rounded-md border border-dashed border-iris-violet bg-blue-soft type-mono text-iris-violet ${className ?? ""}`}
    >
      {label}
    </div>
  );
}

export const sidebar = <Sidebar {...(SidebarStories.args as SidebarProps)} />;
export const composer = (
  <Composer {...(ComposerStories.args as ComposerProps)} />
);
export const topBar = <PageTopBar {...PageTopBarStories.args} />;
export const settingsNav = <SettingsNav {...SettingsNavStories.args} />;
export const orderSummary = <OrderSummary {...OrderSummaryStories.args} />;

export type Fixture = ReactNode;
