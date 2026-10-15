"use client";

import { useFormatter, useTranslations } from "next-intl";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { DeleteDialog } from "@/components/organisms/DeleteDialog";
import { useRouter } from "@/lib/i18n/navigation";
import { CREDIT_IN_BDT, DEMO_BALANCE, DEMO_CHATS } from "@/lib/mock/demo";

import { downloadProfileData } from "./download";
import { useSettings } from "./SettingsState";

// "Overlay · Delete account" (Figma 28:11138): opened from Profile's Delete account (desktop) and
// M41's Delete account row. Typing the confirm word enables Delete; the demo then signs out.

const DeleteAccountContext = createContext<(() => void) | null>(null);

export function useDeleteAccount() {
  const open = useContext(DeleteAccountContext);
  if (!open) throw new Error("useDeleteAccount needs <DeleteAccountProvider>");
  return open;
}

export function DeleteAccountProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("account.deleteDialog");
  const tc = useTranslations("common");
  const format = useFormatter();
  const router = useRouter();
  const { profile, notifications } = useSettings();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const openDialog = useCallback(() => {
    setSession((s) => s + 1);
    setDeleting(false);
    setOpen(true);
  }, []);

  const money = tc("money", {
    amount: format.number(DEMO_BALANCE.credits * CREDIT_IN_BDT, {
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
        onDelete={() => {
          setDeleting(true);
          // Demo: the account is gone, so the person is signed out. Close the dialog first: pages
          // stay mounted (hidden) after navigation, but the dialog's portal would not.
          setOpen(false);
          router.replace("/sign-in");
        }}
        title={t("title")}
        body={t("body")}
        losses={[
          {
            label: t("chatsLabel"),
            value: t("chats", { count: DEMO_CHATS.length }),
          },
          {
            label: t("creditsLabel"),
            value: t("credits", {
              credits: format.number(DEMO_BALANCE.credits),
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
              onClick={() => downloadProfileData(profile, { notifications })}
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
