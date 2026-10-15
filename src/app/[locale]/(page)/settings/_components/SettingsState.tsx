"use client";

import { useTranslations } from "next-intl";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { Toast } from "@/components/molecules/Toast";
import { api } from "@/lib/api-client";
import {
  NOTIFICATION_DEFAULTS,
  NotificationPrefs,
} from "@/lib/contracts/account";
import { MeResponse } from "@/lib/contracts/auth";
import { me, useMe } from "@/lib/me";
import { DEMO_LOW_BALANCE, DEMO_PREFERENCES } from "@/lib/mock/settings";

// State the settings screens share: the profile (GET/PATCH /api/me), notification choices
// (GET/PUT /api/me/notifications, saved as you toggle), whether a password is set, and a toast.
// "Amounts" and "Density" have no account field yet, so they are kept on this device.

export type Preferences = typeof DEMO_PREFERENCES;

export interface SavedProfile {
  name: string;
  preferences: Preferences;
}

type MobileKey = "lowBalance" | "longAnswers" | "offers";

interface SettingsState {
  profile: SavedProfile;
  /** PATCH /api/me; rejects when it fails (the caller shows the message). */
  saveProfile: (profile: SavedProfile) => Promise<void>;
  notifications: Record<string, Record<string, boolean>>;
  setNotification: (type: string, channel: string, on: boolean) => void;
  lowBalance: number;
  setLowBalance: (credits: number) => void;
  /** M40's switches: the app channel of the matching type. */
  mobileNotifications: Record<MobileKey, boolean>;
  setMobileNotification: (key: MobileKey, on: boolean) => void;
  passwordSet: boolean;
  showToast: (message: string, tone?: "success" | "error") => void;
}

const SettingsContext = createContext<SettingsState | null>(null);

export function useSettings() {
  const value = useContext(SettingsContext);
  if (!value) throw new Error("useSettings needs <SettingsStateProvider>");
  return value;
}

// ---- Per-device preferences (amounts, density)

const DEVICE_KEY = "multiai-preferences";
const DEVICE_EVENT = "multiai-preferences";
type DevicePrefs = Pick<Preferences, "amounts" | "density">;
const DEVICE_DEFAULT: DevicePrefs = {
  amounts: DEMO_PREFERENCES.amounts,
  density: DEMO_PREFERENCES.density,
};
let deviceCache: { raw: string | null; value: DevicePrefs } = {
  raw: null,
  value: DEVICE_DEFAULT,
};
function readDevice(): DevicePrefs {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(DEVICE_KEY);
  } catch {}
  if (raw !== deviceCache.raw) {
    let parsed: Partial<DevicePrefs> = {};
    try {
      parsed = JSON.parse(raw ?? "{}") as Partial<DevicePrefs>;
    } catch {}
    deviceCache = {
      raw,
      value: {
        amounts: parsed.amounts === "credits" ? "credits" : "both",
        density: parsed.density === "compact" ? "compact" : "comfortable",
      },
    };
  }
  return deviceCache.value;
}
function subscribeDevice(cb: () => void) {
  window.addEventListener(DEVICE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(DEVICE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
function writeDevice(p: DevicePrefs) {
  try {
    localStorage.setItem(DEVICE_KEY, JSON.stringify(p));
  } catch {}
  window.dispatchEvent(new Event(DEVICE_EVENT));
}

/** The account's answer language ("auto") ↔ the Select's "same". */
const toUiLanguage = (v: string | undefined): Preferences["answerLanguage"] =>
  v === "en" || v === "bn" ? v : "same";
const toApiLanguage = (v: Preferences["answerLanguage"]) =>
  v === "same" ? "auto" : v;

export function SettingsStateProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("settings.notifications");
  const { user } = useMe();
  const device = useSyncExternalStore(
    subscribeDevice,
    readDevice,
    () => DEVICE_DEFAULT,
  );
  const [notifications, setNotifications] = useState<
    Record<string, Record<string, boolean>>
  >(NOTIFICATION_DEFAULTS);
  const [lowBalanceOverride, setLowBalanceOverride] = useState<number>();
  const [loadedLowBalance, setLoadedLowBalance] = useState<number>();
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    tone: "success" | "error";
  } | null>(null);
  // The threshold waiting to be saved (the stepper can be clicked quickly; save the last value).
  const [pendingLowBalance, setPendingLowBalance] = useState<number>();

  const showToast = useCallback(
    (message: string, tone: "success" | "error" = "success") =>
      setToast({ id: Date.now(), message, tone }),
    [],
  );
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  // Notification choices, once per visit to Settings.
  useEffect(() => {
    let live = true;
    api("/api/me/notifications", { schema: NotificationPrefs })
      .then((n) => {
        if (!live) return;
        setNotifications(n.prefs);
        setLoadedLowBalance(n.lowBalanceAlert);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const putNotifications = useCallback(
    (body: NotificationPrefs, undo: () => void) =>
      api("/api/me/notifications", {
        method: "PUT",
        body,
        schema: NotificationPrefs,
      }).catch(() => {
        undo();
        showToast(t("saveFailed"), "error");
      }),
    [showToast, t],
  );

  const setNotification = useCallback(
    (type: string, channel: string, on: boolean) => {
      const flip = (value: boolean) =>
        setNotifications((n) => ({
          ...n,
          [type]: { ...n[type], [channel]: value },
        }));
      flip(on);
      void putNotifications({ prefs: { [type]: { [channel]: on } } }, () =>
        flip(!on),
      );
    },
    [putNotifications],
  );

  const lowBalance =
    lowBalanceOverride ?? loadedLowBalance ?? DEMO_LOW_BALANCE.credits;
  const setLowBalance = useCallback((credits: number) => {
    setLowBalanceOverride(credits);
    setPendingLowBalance(credits);
  }, []);
  useEffect(() => {
    if (pendingLowBalance === undefined) return;
    const id = setTimeout(() => {
      setPendingLowBalance(undefined);
      void putNotifications(
        { prefs: {}, lowBalanceAlert: pendingLowBalance },
        () => setLowBalanceOverride(undefined),
      );
    }, 600);
    return () => clearTimeout(id);
  }, [pendingLowBalance, putNotifications]);

  const profile = useMemo<SavedProfile>(
    () => ({
      name: user?.name ?? "",
      preferences: {
        answerLanguage: toUiLanguage(user?.answerLanguage),
        ...device,
      },
    }),
    [user?.name, user?.answerLanguage, device],
  );

  const saveProfile = useCallback(async (next: SavedProfile) => {
    const res = await api("/api/me", {
      method: "PATCH",
      body: {
        name: next.name,
        answerLanguage: toApiLanguage(next.preferences.answerLanguage),
      },
      schema: MeResponse,
    });
    me.setUser(res.user);
    writeDevice({
      amounts: next.preferences.amounts,
      density: next.preferences.density,
    });
  }, []);

  const value = useMemo<SettingsState>(
    () => ({
      profile,
      saveProfile,
      notifications,
      setNotification,
      lowBalance,
      setLowBalance,
      mobileNotifications: {
        lowBalance: !!notifications.lowBalance?.app,
        longAnswers: !!notifications.longAnswers?.app,
        offers: !!notifications.offers?.app,
      },
      setMobileNotification: (key, on) => setNotification(key, "app", on),
      passwordSet: !!user?.hasPassword,
      showToast,
    }),
    [
      profile,
      saveProfile,
      notifications,
      setNotification,
      lowBalance,
      setLowBalance,
      user?.hasPassword,
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
