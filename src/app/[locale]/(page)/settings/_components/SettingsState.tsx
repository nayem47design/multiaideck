"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { Toast } from "@/components/molecules/Toast";
import { DEMO_USER } from "@/lib/mock/demo";
import {
  DEMO_MOBILE_NOTIFICATIONS,
  DEMO_NOTIFICATIONS,
  DEMO_LOW_BALANCE,
  DEMO_PREFERENCES,
} from "@/lib/mock/settings";

// Demo state shared by the settings screens while you move between them (until the backend lands):
// the saved profile, notification choices, whether a password is set, and a toast.

export type Preferences = typeof DEMO_PREFERENCES;

export interface SavedProfile {
  name: string;
  preferences: Preferences;
}

interface SettingsState {
  profile: SavedProfile;
  saveProfile: (profile: SavedProfile) => void;
  notifications: Record<string, Record<string, boolean>>;
  setNotification: (type: string, channel: string, on: boolean) => void;
  lowBalance: number;
  setLowBalance: (credits: number) => void;
  mobileNotifications: typeof DEMO_MOBILE_NOTIFICATIONS;
  setMobileNotification: (
    key: keyof typeof DEMO_MOBILE_NOTIFICATIONS,
    on: boolean,
  ) => void;
  passwordSet: boolean;
  setPasswordSet: (set: boolean) => void;
  showToast: (message: string, tone?: "success" | "error") => void;
}

const SettingsContext = createContext<SettingsState | null>(null);

export function useSettings() {
  const value = useContext(SettingsContext);
  if (!value) throw new Error("useSettings needs <SettingsStateProvider>");
  return value;
}

export function SettingsStateProvider({ children }: { children: ReactNode }) {
  const [profile, saveProfile] = useState<SavedProfile>({
    name: DEMO_USER.name,
    preferences: DEMO_PREFERENCES,
  });
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);
  const [lowBalance, setLowBalance] = useState(DEMO_LOW_BALANCE.credits);
  const [mobileNotifications, setMobileNotifications] = useState(
    DEMO_MOBILE_NOTIFICATIONS,
  );
  const [passwordSet, setPasswordSet] = useState(false);
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    tone: "success" | "error";
  } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showToast = useCallback(
    (message: string, tone: "success" | "error" = "success") => {
      clearTimeout(timer.current);
      setToast({ id: Date.now(), message, tone });
      timer.current = setTimeout(() => setToast(null), 3000);
    },
    [],
  );
  useEffect(() => () => clearTimeout(timer.current), []);

  const value = useMemo<SettingsState>(
    () => ({
      profile,
      saveProfile,
      notifications,
      setNotification: (type, channel, on) =>
        setNotifications((n) => ({
          ...n,
          [type]: { ...n[type], [channel]: on },
        })),
      lowBalance,
      setLowBalance,
      mobileNotifications,
      setMobileNotification: (key, on) =>
        setMobileNotifications((n) => ({ ...n, [key]: on })),
      passwordSet,
      setPasswordSet,
      showToast,
    }),
    [
      profile,
      notifications,
      lowBalance,
      mobileNotifications,
      passwordSet,
      showToast,
    ],
  );

  return (
    <SettingsContext value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--tab-bar-height)+var(--space-4))] z-50 flex justify-center px-4 md:bottom-6"
      >
        {toast && (
          <Toast key={toast.id} tone={toast.tone}>
            {toast.message}
          </Toast>
        )}
      </div>
    </SettingsContext>
  );
}
