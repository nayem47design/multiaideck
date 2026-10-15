"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { NewProjectDialog } from "@/components/organisms/NewProjectDialog";
import { ApiClientError } from "@/lib/api-client";
import { PROJECT_NAME_MAX } from "@/lib/contracts/projects";
import { useRouter } from "@/lib/i18n/navigation";
import { projectActions } from "@/lib/projects";

import type { OverlayProps } from "../_shell/overlays";

// Figma: "Overlay · New project" (245:36384, Dark 245:36921); below 768px a bottom sheet. Opened
// with useOverlay().openOverlay("new-project") (the sidebar's "＋" next to Projects). Create
// project → POST /api/projects → the new project's page (prototype: Create project → Project page).

export function NewProjectOverlay({ open, onOpenChange }: OverlayProps) {
  const t = useTranslations("projects");
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const create = async () => {
    const clean = name.trim();
    setBusy(true);
    setError(undefined);
    try {
      const project = await projectActions.create(clean);
      setName("");
      onOpenChange(false);
      router.push(`/projects/${project.id}`);
    } catch (e) {
      setError(
        e instanceof ApiClientError && e.code === "conflict"
          ? t("errors.taken", { name: clean })
          : t("errors.failed"),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <NewProjectDialog
      open={open}
      onOpenChange={(next) => {
        // Opened by openOverlay(), so start clean whenever it closes.
        if (!next) {
          setName("");
          setError(undefined);
        }
        onOpenChange(next);
      }}
      title={t("dialog.title")}
      body={t("dialog.body")}
      label={t("dialog.label")}
      placeholder={t("dialog.placeholder")}
      cancelLabel={t("dialog.cancel")}
      submitLabel={t("dialog.create")}
      value={name}
      onValueChange={(v) => {
        setName(v);
        setError(undefined);
      }}
      maxLength={PROJECT_NAME_MAX}
      error={error}
      busy={busy}
      onSubmit={create}
    />
  );
}
