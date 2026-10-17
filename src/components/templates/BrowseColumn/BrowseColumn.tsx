"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cx } from "@/components/atoms/states";
import { Toast, type ToastTone } from "@/components/molecules/Toast";

import { AppMain } from "../AppShell";

// The main column of the browse screens (Prototype › Chats, Image studio, Presets): an 860px column
// centred in the app shell's main area, 40px from the top of the screen. Below 768px the screen's
// own MobileTopBar sits on top and the content runs edge to edge with the 16px gutter; with the
// tab bar (Chats) the content clears it. Also shows a short-lived toast for screen actions.

export interface BrowseColumnProps {
  children: ReactNode;
  /** Mobile top bar (below 768px). */
  mobileTopBar?: ReactNode;
  /** The screen shows the mobile tab bar: leave room for it. */
  tabBar?: boolean;
  toast?: BrowseToast | null;
  className?: string;
}

export interface BrowseToast {
  id: number;
  tone: ToastTone;
  message: ReactNode;
  action?: ReactNode;
}

export function BrowseColumn({
  children,
  mobileTopBar,
  tabBar = false,
  toast,
  className,
}: BrowseColumnProps) {
  return (
    <AppMain className="max-md:pt-0! lg:pt-[calc(var(--browse-top)-var(--shell-pad))]!">
      {mobileTopBar && <div className="md:hidden">{mobileTopBar}</div>}
      <div
        className={cx(
          "mx-auto box-content max-w-browse-main-w px-mobile-gutter pt-2 pb-8 md:pt-0 lg:px-8",
          tabBar && "max-md:pb-[calc(var(--tab-bar-height)+var(--space-8))]",
          className,
        )}
      >
        {children}
      </div>
      {toast && (
        <div
          key={toast.id}
          className={cx(
            "pointer-events-none fixed inset-x-0 z-30 flex justify-center px-mobile-gutter",
            tabBar
              ? "bottom-[calc(var(--tab-bar-height)+var(--space-4))] md:bottom-6"
              : "bottom-6",
          )}
        >
          <Toast tone={toast.tone} className="pointer-events-auto">
            {toast.message}
            {toast.action}
          </Toast>
        </div>
      )}
    </AppMain>
  );
}

/** A toast that hides itself after `ms` (default 4s). */
export function useBrowseToast(ms = 4000) {
  const [toast, setToast] = useState<BrowseToast | null>(null);
  const next = useRef(0);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), ms);
    return () => clearTimeout(id);
  }, [toast, ms]);
  const show = useCallback(
    (message: ReactNode, options?: { tone?: ToastTone; action?: ReactNode }) =>
      setToast({
        id: ++next.current,
        tone: options?.tone ?? "success",
        message,
        action: options?.action,
      }),
    [],
  );
  const hide = useCallback(() => setToast(null), []);
  return { toast, show, hide };
}
