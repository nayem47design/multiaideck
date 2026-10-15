import { AppFrame } from "../_shell/AppFrame";
import { OverlayProvider } from "../_shell/overlays";

export default function AppLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <OverlayProvider>
      <AppFrame>{children}</AppFrame>
    </OverlayProvider>
  );
}
