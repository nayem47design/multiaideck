import { MeProvider } from "@/lib/me";

import { AppFrame } from "../_shell/AppFrame";
import { OverlayProvider } from "../_shell/overlays";

export default function AppLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <MeProvider>
      <OverlayProvider>
        <AppFrame>{children}</AppFrame>
      </OverlayProvider>
    </MeProvider>
  );
}
