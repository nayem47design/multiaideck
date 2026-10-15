import { useTranslations } from "next-intl";

import { LightField } from "@/components/atoms/LightField";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Link } from "@/lib/i18n/navigation";

// Unknown chats and pages. Copy: common.notFound.
export default function NotFound() {
  const t = useTranslations("common.notFound");
  return (
    <main className="relative isolate flex min-h-dvh items-center justify-center bg-canvas p-shell-pad">
      <LightField variant="page" fixed />
      <EmptyState
        icon="search-01"
        title={t("title")}
        body={t("body")}
        action={
          <Link
            href="/"
            className="type-label text-blue underline-offset-4 hover:underline"
          >
            {t("home")}
          </Link>
        }
      />
    </main>
  );
}
