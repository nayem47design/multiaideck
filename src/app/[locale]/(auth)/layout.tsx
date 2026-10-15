import { LightField } from "@/components/atoms/LightField";

// Sign in and Enter code: no sidebar, the auth light field (Figma: Desktop · Sign in, M1, M16, M17).
export default function AuthLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <div className="relative isolate min-h-dvh bg-canvas">
      <LightField variant="auth" fixed />
      {children}
    </div>
  );
}
