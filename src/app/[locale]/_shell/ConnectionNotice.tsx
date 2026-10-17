"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useSyncExternalStore } from "react";

import { Toast } from "@/components/molecules/Toast";

// Not in Figma yet (07 · Gaps › Offline and server errors, P1): a Toast (Error) while the device
// is offline, and a short Toast (Success) when it's back. Above the mobile tab bar.

const subscribe = (onChange: () => void) => {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
};

const BACK_ONLINE_MS = 3000;

export function ConnectionNotice() {
  const t = useTranslations("common.connection");
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  const [wasOffline, setWasOffline] = useState(false);
  const [showBack, setShowBack] = useState(false);
  if (!online && !wasOffline) setWasOffline(true);
  if (online && wasOffline) {
    setWasOffline(false);
    setShowBack(true);
  }
  useEffect(() => {
    if (!showBack) return;
    const id = setTimeout(() => setShowBack(false), BACK_ONLINE_MS);
    return () => clearTimeout(id);
  }, [showBack]);

  if (online && !showBack) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 max-md:bottom-[calc(var(--tab-bar-height)+var(--space-4))]">
      <Toast
        tone={online ? "success" : "error"}
        className="pointer-events-auto"
      >
        {online ? t("back") : t("offline")}
      </Toast>
    </div>
  );
}
