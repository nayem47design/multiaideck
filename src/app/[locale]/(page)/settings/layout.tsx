import { SettingsFrame } from "./_components/SettingsFrame";

// Settings and Account: /settings (M15 on phones, Profile on desktop) and its sub-pages.
export default function SettingsLayout({
  children,
}: LayoutProps<"/[locale]/settings">) {
  return <SettingsFrame>{children}</SettingsFrame>;
}
