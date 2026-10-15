import { MeProvider } from "@/lib/me";

import { MobileTabs } from "../_shell/MobileTabs";
import { OverlayProvider } from "../_shell/overlays";

// Full-page screens with the Page top bar instead of the sidebar: Wallet and Settings.
export default function PageLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <MeProvider>
      <OverlayProvider>
        <div className="relative isolate min-h-dvh bg-canvas">{children}</div>
        <MobileTabs />
      </OverlayProvider>
    </MeProvider>
  );
}
