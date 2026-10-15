"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { DeleteDialog } from "@/components/organisms/DeleteDialog";
import { api } from "@/lib/api-client";
import { getPathname } from "@/lib/i18n/navigation";
import { me, useMe } from "@/lib/me";

import { downloadAccountData } from "./download";
import { useSettings } from "./SettingsState";

// "Overlay · Delete account" (Figma 28:11138): opened from Profile's Delete account (desktop) and
// M41's Delete account row. Typing the confirm word enables Delete → DELETE /api/me (the account is
// closed and every session ends) → a full page load of /sign-in.

const DeleteAccountContext = createContext<(() => void) | null>(null);

export function useDeleteAccount() {
  const open = useContext(DeleteAccountContext);
  if (!open) throw new Error("useDeleteAccount needs <DeleteAccountProvider>");
  return open;
}

export function DeleteAccountProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("account.deleteDialog");
  const tc = useTranslations("common");
  const tp = useTranslations("settings.privacy.data");
  const format = useFormatter();
  const locale = useLocale();
  const { balance, chatCount } = useMe();
  const { showToast } = useSettings();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const openDialog = useCallback(() => {
    setSession((s) => s + 1);
    setDeleting(false);
    setOpen(true);
  }, []);

  const money = tc("money", {
    amount: format.number(balance?.bdt ?? 0, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  });
  const word = t("word");

  const context = useMemo(() => openDialog, [openDialog]);

  return (
    <DeleteAccountContext value={context}>
      {children}
      <DeleteDialog
        key={session}
        open={open}
        onOpenChange={setOpen}
        deleting={deleting}
        onDelete={async () => {
          setDeleting(true);
          try {
            await api("/api/me", {
              method: "DELETE",
              body: { confirm: "DELETE" },
            });
          } catch {
            setDeleting(false);
            showToast(t("failed"), "error");
            return;
          }
          me.clear();
          location.replace(getPathname({ href: "/sign-in", locale }));
        }}
        title={t("title")}
        body={t("body")}
        losses={[
          {
            label: t("chatsLabel"),
            value: t("chats", { count: chatCount ?? 0 }),
          },
          {
            label: t("creditsLabel"),
            value: t("credits", {
              credits: format.number(Math.floor(balance?.credits ?? 0)),
              money,
            }),
            strong: true,
          },
          { label: t("profileLabel"), value: t("profile") },
        ]}
        download={{
          label: t("download"),
          link: (
            <button
              type="button"
              onClick={() =>
                downloadAccountData().catch(() =>
                  showToast(tp("downloadFailed"), "error"),
                )
              }
            />
          ),
        }}
        confirmLabel={t("confirmLabel", { word })}
        confirmWord={word}
        cancelLabel={t("cancel")}
        deleteLabel={t("delete")}
        contentClassName="max-md:right-4 max-md:left-4 max-md:translate-x-0"
        panelClassName="max-md:max-h-[calc(100dvh-var(--space-8))] max-md:w-full max-md:overflow-y-auto max-md:p-6"
      />
    </DeleteAccountContext>
  );
}
