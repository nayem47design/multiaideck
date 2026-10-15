import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { MODELS, type ModelId } from "@/lib/ai/models";
import { requireUser } from "@/lib/auth/session";
import { usageCsv, usageReport } from "@/lib/billing/usage";
import { UsagePeriod } from "@/lib/contracts/account";
import { getDb } from "@/lib/db";
import { locales } from "@/lib/i18n/config";
import { readQuery, route } from "@/lib/server/api";

const Query = z.object({
  period: UsagePeriod.default("this-month"),
  locale: z.enum(locales).default("en"),
});

// The usage report as CSV (one line per model per prompt), headers in the person's language.
export const GET = route(async (req: Request) => {
  const user = await requireUser();
  const { period, locale } = readQuery(req, Query);
  const report = await usageReport(await getDb(), user.id, period);
  const t = await getTranslations({ locale, namespace: "settings.usage" });
  const csv = usageCsv(
    report,
    {
      date: t("csv.date"),
      chat: t("csv.chat"),
      mode: t("csv.mode"),
      model: t("csv.model"),
      credits: t("csv.credits"),
      taka: t("csv.taka"),
    },
    (mode) => t(`activity.filters.${mode as "best" | "compare" | "image"}`),
    (model) => MODELS[model as ModelId]?.name ?? model,
  );
  // A BOM so Excel opens Bangla text as UTF-8.
  return new Response(`﻿${csv}\n`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="multiai-usage-${period}.csv"`,
      "cache-control": "no-store",
    },
  });
});
