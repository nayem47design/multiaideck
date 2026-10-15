"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { z } from "zod";

import { Button } from "@/components/atoms/Button";
import { cx } from "@/components/atoms/states";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Field } from "@/components/molecules/Field";
import { PageTopBar } from "@/components/organisms/PageTopBar";
import { TableCard, TableCell } from "@/components/organisms/TableCard";
import { api, ApiClientError } from "@/lib/api-client";
import { AdminUserDetail, AdminUserSchema } from "@/lib/contracts/account";
import { PaymentSchema } from "@/lib/contracts/wallet";
import { Link } from "@/lib/i18n/navigation";
import { METHOD_NAMES } from "@/lib/payments/client";

// A minimal support console (desktop): search users, open one to see their balance, payments and
// ledger, refund credits with a reason (appends a "refund" ledger entry), and run the ledger check.
// Built from existing components; everything it shows comes from /api/admin/*.

type AdminUser = z.infer<typeof AdminUserSchema>;
type Detail = z.infer<typeof AdminUserDetail>;
const Payments = z.array(PaymentSchema);
const Users = z.object({ users: z.array(AdminUserSchema) });
const Reconcile = z.object({
  checkedPayments: z.number(),
  checkedEntries: z.number(),
  mismatches: z.array(
    z.object({
      kind: z.string(),
      paymentId: z.string(),
      invoice: z.string().nullable(),
      expectedCredits: z.number(),
      ledgerCredits: z.number(),
    }),
  ),
});

const TZ = "Asia/Dhaka";
const COL = "min-w-0 flex-1";

function Row({ children }: { children: ReactNode }) {
  return (
    <div
      role="row"
      className="flex min-h-table-row-height items-center gap-4 px-4 py-2"
    >
      {children}
    </div>
  );
}

function Cell({
  children,
  strong,
}: {
  children?: ReactNode;
  strong?: boolean;
}) {
  return (
    <TableCell
      width={COL}
      className={cx(
        "break-words",
        strong
          ? "type-nav-item-selected text-ink"
          : "type-order-summary-label text-ink-2",
      )}
    >
      <span className="min-w-0 break-words">{children}</span>
    </TableCell>
  );
}

export function AdminScreen() {
  const t = useTranslations("admin");
  const format = useFormatter();
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const n = (v: number) => format.number(v);
  const credits = (v: number) => t("user.credits", { amount: n(v) });
  const when = (iso: string) =>
    format.dateTime(new Date(iso), {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: TZ,
    });

  const run = async <T,>(fn: () => Promise<T>) => {
    setBusy(true);
    setError(false);
    try {
      return await fn();
    } catch (e) {
      if (e instanceof ApiClientError && e.status === 403) setForbidden(true);
      else setError(true);
    } finally {
      setBusy(false);
    }
  };

  const search = (e?: FormEvent) => {
    e?.preventDefault();
    void run(async () => {
      const res = await api(`/api/admin/users?q=${encodeURIComponent(q)}`, {
        schema: Users,
      });
      setUsers(res.users);
      setDetail(null);
    });
  };
  // Newest users on load (and "Admins only" right away for everyone else).
  useEffect(() => {
    let live = true;
    api("/api/admin/users", { schema: Users })
      .then((res) => live && setUsers(res.users))
      .catch((e: unknown) => {
        if (!live) return;
        if (e instanceof ApiClientError && e.status === 403) setForbidden(true);
        else setError(true);
      });
    return () => {
      live = false;
    };
  }, []);

  const open = (id: string) =>
    void run(async () =>
      setDetail(
        await api(`/api/admin/users/${encodeURIComponent(id)}`, {
          schema: AdminUserDetail,
        }),
      ),
    );

  const top = (
    <PageTopBar
      title={t("title")}
      back={{
        label: t("backToChat"),
        icon: "arrow-left-01",
        link: <Link href="/" />,
      }}
    />
  );

  if (forbidden)
    return (
      <div className="px-shell-pad pt-shell-pad pb-16">
        {top}
        <main className="mx-auto mt-page-top w-full max-w-page-width">
          <EmptyState
            icon="square-lock-02"
            title={t("forbidden.title")}
            body={t("forbidden.body")}
          />
        </main>
      </div>
    );

  return (
    <div className="px-shell-pad pt-shell-pad pb-16">
      {top}
      <main className="mx-auto mt-page-top flex w-full max-w-page-width flex-col gap-12">
        <h2 className="type-wallet-title text-ink">{t("title")}</h2>
        {error && (
          <p role="alert" className="type-ui text-error">
            {t("error")}
          </p>
        )}

        {detail ? (
          <UserDetail
            detail={detail}
            onBack={() => setDetail(null)}
            onChange={setDetail}
            credits={credits}
            when={when}
            n={n}
          />
        ) : (
          <section className="flex flex-col gap-4">
            <form onSubmit={search} className="flex items-end gap-4">
              <Field
                label={t("search.label")}
                help={t("search.help")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                type="search"
                className="max-w-order-summary-width"
              />
              <Button type="submit" loading={busy} className="mb-6">
                {t("search.button")}
              </Button>
            </form>
            {users && (
              <TableCard
                footnote={users.length ? undefined : t("search.empty")}
                columns={[
                  { label: t("search.columns.name"), width: COL },
                  { label: t("search.columns.phone"), width: COL },
                  { label: t("search.columns.email"), width: COL },
                  { label: t("search.columns.plan"), width: COL },
                  { label: t("search.columns.balance"), width: COL },
                  { label: "", width: COL },
                ]}
              >
                {users.map((u) => (
                  <Row key={u.id}>
                    <Cell strong>{u.name || t("user.noName")}</Cell>
                    <Cell>{u.phone}</Cell>
                    <Cell>{u.email}</Cell>
                    <Cell>{t(`user.plans.${u.plan}`)}</Cell>
                    <Cell>{credits(u.balanceCredits)}</Cell>
                    <TableCell width={COL}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => open(u.id)}
                      >
                        {t("search.open")}
                      </Button>
                    </TableCell>
                  </Row>
                ))}
              </TableCard>
            )}
          </section>
        )}

        <ReconcileCard n={n} />
      </main>
    </div>
  );
}

function UserDetail({
  detail,
  onBack,
  onChange,
  credits,
  when,
  n,
}: {
  detail: Detail;
  onBack: () => void;
  onChange: (d: Detail) => void;
  credits: (v: number) => string;
  when: (iso: string) => string;
  n: (v: number) => string;
}) {
  const t = useTranslations("admin");
  const u = detail.user;
  const payments = Payments.parse(detail.payments);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  // One key per refund form: a retried request is a no-op on the server.
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [state, setState] = useState<"idle" | "busy" | "done" | "failed">(
    "idle",
  );
  const [refunded, setRefunded] = useState(0);
  const value = Number(amount);
  const valid = value > 0 && reason.trim().length >= 5;

  const refund = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid || state === "busy") return;
    setState("busy");
    try {
      const res = await fetch(
        `/api/admin/users/${encodeURIComponent(u.id)}/refund`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "content-type": "application/json",
            "idempotency-key": key,
          },
          body: JSON.stringify({ credits: value, reason: reason.trim() }),
        },
      );
      if (!res.ok) throw new Error(String(res.status));
      onChange(AdminUserDetail.parse(await res.json()));
      setRefunded(value);
      setAmount("");
      setReason("");
      setKey(crypto.randomUUID());
      setState("done");
    } catch {
      setState("failed");
    }
  };

  return (
    <>
      <section className="flex flex-col gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            icon="arrow-left-01"
            onClick={onBack}
          >
            {t("user.back")}
          </Button>
        </div>
        <h3 className="type-wallet-section text-ink">
          {u.name || t("user.noName")}
        </h3>
        <p className="type-wallet-section-lede text-ink-2">
          {[u.phone, u.email].filter(Boolean).join(" · ")}
        </p>
        <TableCard
          columns={[
            { label: t("user.balance"), width: COL },
            { label: t("user.plan"), width: COL },
          ]}
        >
          <Row>
            <Cell strong>{credits(u.balanceCredits)}</Cell>
            <Cell>{t(`user.plans.${u.plan}`)}</Cell>
          </Row>
        </TableCard>
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="type-wallet-section text-ink">{t("refund.title")}</h3>
        <form
          onSubmit={refund}
          className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-6 shadow-stat-card"
        >
          <Field
            label={t("refund.credits")}
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Field
            label={t("refund.reason")}
            help={t("refund.reasonHelp")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
          />
          <div className="flex items-center gap-4">
            <Button type="submit" disabled={!valid} loading={state === "busy"}>
              {t("refund.submit")}
            </Button>
            {state === "done" && (
              <p role="status" className="type-ui text-success">
                {t("refund.done", { credits: n(refunded) })}
              </p>
            )}
            {state === "failed" && (
              <p role="alert" className="type-ui text-error">
                {t("refund.failed")}
              </p>
            )}
          </div>
        </form>
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="type-wallet-section text-ink">{t("payments.title")}</h3>
        <TableCard
          footnote={payments.length ? undefined : t("payments.empty")}
          columns={[
            { label: t("payments.columns.date"), width: COL },
            { label: t("payments.columns.amount"), width: COL },
            { label: t("payments.columns.credits"), width: COL },
            { label: t("payments.columns.status"), width: COL },
            { label: t("payments.columns.invoice"), width: COL },
          ]}
        >
          {payments.map((p) => (
            <Row key={p.id}>
              <Cell>{when(p.createdAt)}</Cell>
              <Cell strong>
                {t("payments.amount", {
                  amount: n(p.bdt),
                  method: METHOD_NAMES[p.method],
                })}
              </Cell>
              <Cell>{credits(p.credits)}</Cell>
              <Cell>{t(`payments.status.${p.status}`)}</Cell>
              <Cell>{p.providerTrxId ?? p.invoice}</Cell>
            </Row>
          ))}
        </TableCard>
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="type-wallet-section text-ink">{t("ledger.title")}</h3>
        <TableCard
          footnote={detail.ledger.length ? undefined : t("ledger.empty")}
          columns={[
            { label: t("ledger.columns.date"), width: COL },
            { label: t("ledger.columns.kind"), width: COL },
            { label: t("ledger.columns.credits"), width: COL },
            { label: t("ledger.columns.note"), width: COL },
          ]}
        >
          {detail.ledger.map((e) => (
            <Row key={e.id}>
              <Cell>{when(e.createdAt)}</Cell>
              <Cell strong>{e.kind}</Cell>
              <Cell>{n(e.credits)}</Cell>
              <Cell>
                {e.createdBy && e.note
                  ? t("ledger.byAdmin", { note: e.note })
                  : (e.note ?? "")}
              </Cell>
            </Row>
          ))}
        </TableCard>
      </section>
    </>
  );
}

function ReconcileCard({ n }: { n: (v: number) => string }) {
  const t = useTranslations("admin");
  const [report, setReport] = useState<z.infer<typeof Reconcile> | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const check = async () => {
    setBusy(true);
    setFailed(false);
    try {
      setReport(await api("/api/admin/reconcile", { schema: Reconcile }));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <h3 className="type-wallet-section text-ink">{t("reconcile.title")}</h3>
      <p className="type-wallet-section-lede text-ink-2">
        {t("reconcile.body")}
      </p>
      <div className="flex items-center gap-4">
        <Button variant="secondary" loading={busy} onClick={() => void check()}>
          {t("reconcile.run")}
        </Button>
        {failed && (
          <p role="alert" className="type-ui text-error">
            {t("error")}
          </p>
        )}
        {report && (
          <p
            role="status"
            className={cx(
              "type-ui",
              report.mismatches.length ? "text-error" : "text-success",
            )}
          >
            {report.mismatches.length
              ? t("reconcile.found", {
                  count: report.mismatches.length,
                  payments: report.checkedPayments,
                })
              : t("reconcile.ok", { payments: report.checkedPayments })}
          </p>
        )}
      </div>
      {report && report.mismatches.length > 0 && (
        <ul className="flex flex-col gap-2 type-ui text-ink-2">
          {report.mismatches.map((m) => (
            <li key={`${m.kind}:${m.paymentId}`}>
              {t("reconcile.row", {
                kind: m.kind,
                invoice: m.invoice ?? m.paymentId,
                expected: n(m.expectedCredits),
                ledger: n(m.ledgerCredits),
              })}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
