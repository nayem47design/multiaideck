"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { GoProOverlay } from "../_overlays/GoProOverlay";
import { NewProjectOverlay } from "../_overlays/NewProjectOverlay";
import { ProOnOverlay } from "../_overlays/ProOnOverlay";
import { SearchOverlay } from "../_overlays/SearchOverlay";
import { SignOutOverlay } from "../_overlays/SignOutOverlay";

// App-wide overlays from the prototype that open over any screen: ⌘K search, Go Pro, Pro is on,
// and Sign out. Route-specific dialogs (checkout, delete account, model picker) stay in their route.

export type OverlayName =
  "search" | "go-pro" | "pro-on" | "sign-out" | "new-project";

export interface OverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OverlayContextValue {
  overlay: OverlayName | null;
  openOverlay: (name: OverlayName) => void;
  closeOverlay: () => void;
}

const OverlayContext = createContext<OverlayContextValue | null>(null);

export function useOverlay() {
  const value = useContext(OverlayContext);
  if (!value) throw new Error("useOverlay needs <OverlayProvider>");
  return value;
}

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [overlay, setOverlay] = useState<OverlayName | null>(null);
  const openOverlay = useCallback((name: OverlayName) => setOverlay(name), []);
  const closeOverlay = useCallback(() => setOverlay(null), []);

  // ⌘K / Ctrl+K opens chat search from anywhere, as the sidebar shortcut chip promises.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOverlay("search");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo(
    () => ({ overlay, openOverlay, closeOverlay }),
    [overlay, openOverlay, closeOverlay],
  );
  const props = (name: OverlayName): OverlayProps => ({
    open: overlay === name,
    onOpenChange: (open) => setOverlay(open ? name : null),
  });

  return (
    <OverlayContext value={value}>
      {children}
      <SearchOverlay {...props("search")} />
      <GoProOverlay {...props("go-pro")} />
      <ProOnOverlay {...props("pro-on")} />
      <SignOutOverlay {...props("sign-out")} />
      <NewProjectOverlay {...props("new-project")} />
    </OverlayContext>
  );
}
