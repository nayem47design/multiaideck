"use client";

import { useTranslations } from "next-intl";
import { notFound, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import type { BadgeTone } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { cx } from "@/components/atoms/states";
import { AnswerPager } from "@/components/molecules/AnswerPager";
import { EmptyState } from "@/components/molecules/EmptyState";
import { FollowUpRecipients } from "@/components/molecules/FollowUpRecipients";
import { MobilePrompt } from "@/components/molecules/MobilePrompt";
import { ModelTabs, type ModelTab } from "@/components/molecules/ModelTabs";
import { PromptBubble } from "@/components/molecules/PromptBubble";
import { PromptReceipt } from "@/components/molecules/PromptReceipt";
import { PromptSummary } from "@/components/molecules/PromptSummary";
import { ModelOrb } from "@/components/atoms/ModelOrb";
import { ThinkingStatusBar } from "@/components/molecules/ThinkingStatusBar";
import {
  AnswerCard,
  type AnswerCardProps,
} from "@/components/organisms/AnswerCard";
import { BestAnswerCard } from "@/components/organisms/BestAnswerCard";
import { ChatTopBar } from "@/components/organisms/ChatTopBar";
import { Composer } from "@/components/organisms/Composer";
import {
  MobileAnswerCard,
  type MobileAnswerCardProps,
} from "@/components/organisms/MobileAnswerCard";
import { MobileBestAnswer } from "@/components/organisms/MobileBestAnswer";
import { MobileTopBar } from "@/components/organisms/MobileTopBar";
import { RecipientsSheet } from "@/components/organisms/RecipientsSheet";
import { SuggestionBar } from "@/components/organisms/SuggestionBar";
import {
  ThinkingPanel,
  ThinkingStop,
  type ThinkingRow,
} from "@/components/organisms/ThinkingPanel";
import { WritingCard } from "@/components/organisms/WritingCard";
import { AppMain } from "@/components/templates/AppShell";
import { ApiClientError } from "@/lib/api-client";
import { MODEL_SPECS } from "@/lib/ai/catalog";
import { MODELS, type ModelId } from "@/lib/ai/models";
import type { Answer, Prompt } from "@/lib/contracts/chat";
import { useIsMobile } from "@/lib/hooks/useMedia";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { DEMO_VOICE } from "@/lib/mock/chat";

import { parseParams, type ChatParams } from "./state";
import { isRunning, useChat } from "./useChat";
import { useComposer, type AnswerMode, type SendPayload } from "./useComposer";
import { useChatFormat } from "./useFormat";
import {
  isFailed,
  isOpen,
  promptCredits,
  retryCredits,
  tabOrder,
  tagsOf,
  thinkingRows,
  visibleAnswers,
  type AnswerTag,
} from "./view";

// A chat (/c/[id]) from GET /api/chats/:id, live over each running prompt's event stream. Every
// desktop and mobile state of the prototype's ask-and-compare flow comes from the real data:
// thinking (writing, slow, catching up), Best answer (merge step streaming in), Compare, failures
// with "not charged", retry, swap, stop, and follow-ups with recipients when not every AI answered.
// The latest prompt is shown in full; earlier prompts fold into summaries (desktop).
//
// Deep links (tests and reviews): ?composer=menu|voice|voice-ready|files, ?sheet=mode|models,
// ?tab=<model> (mobile Compare: which answer is shown).

/** Re-render this often while answers are on their way (slow rows, elapsed time). */
const TICK_MS = 1000;

/** Reads the deep-link params; render inside <Suspense>. */
export function ChatRoute({ id }: { id: string }) {
  const sp = useSearchParams();
  const params = parseParams(new URLSearchParams(sp.toString()));
  return <ChatScreen id={id} params={params} />;
}

export function ChatScreen({
  id,
  params,
}: {
  id: string;
  params?: ChatParams;
}) {
  const t = useTranslations("chat");
  const tc = useTranslations("common");
  const tco = useTranslations("composer");
  const { n, cr, secs, money, list } = useChatFormat();
  const router = useRouter();
  const mobile = useIsMobile();
  const { chat, load, reload, send, retry, swap, stop } = useChat(id);

  const prompts = chat?.promptsList ?? [];
  const current: Prompt | undefined = prompts.at(-1);
  const earlier = prompts.slice(0, -1);
  const answers = current ? visibleAnswers(current) : [];
  const tags = tagsOf(answers);
  const answered = answers.filter((a) => a.status === "done");
  const missed = answers.filter(isFailed);
  const running = !!current && isRunning(current);
  const answersOpen = answers.some(isOpen);

  // ---- Mode: the composer's toggle is also the view of the latest prompt.
  const [mode, setMode] = useState<AnswerMode>("best");
  const [seen, setSeen] = useState<string | null>(null);
  if (current && seen !== current.id) {
    setSeen(current.id);
    setMode(current.mode);
  }
  const showBest =
    mode === "best" && current?.mode === "best" && !!current.best;
  // Best answer mode thinks until the answers are in (then the merge streams into the card);
  // Compare thinks until every answer has ended.
  const thinking =
    !!current &&
    (current.mode === "best" && mode === "best"
      ? answersOpen
      : running && answersOpen);

  // A clock for "slow" rows while thinking.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!thinking) return;
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, [thinking]);

  // ---- Sending, retry, swap, stop
  const [recipient, setRecipient] = useState<"all" | ModelId>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const toTopUp = (e: unknown) => {
    if (e instanceof ApiClientError && e.code === "insufficient_credits") {
      router.push("/wallet/top-up");
      return true;
    }
    return false;
  };
  const doSend = async ({ text, models, attachments }: SendPayload) => {
    try {
      await send({
        text,
        mode,
        models,
        attachments,
        recipients:
          missed.length && recipient !== "all" ? [recipient] : undefined,
      });
      setRecipient("all");
      return true;
    } catch (e) {
      toTopUp(e);
      return false;
    }
  };
  const act = (fn: () => Promise<void>) => () =>
    void fn().catch((e) => {
      if (!toTopUp(e)) void reload();
    });
  const retryAnswer = (a: Answer) => act(() => retry(a.id))();
  const swapAnswer = (a: Answer) =>
    composer.openPicker((models) => {
      const next = models.find(
        (m) => m !== a.model && !answers.some((x) => x.model === m),
      );
      if (next) act(() => swap(a.id, next))();
    });
  const onStop = () => current && act(() => stop(current.id))();

  const chatModels = answers.length
    ? answers.map((a) => a.model)
    : (current?.models ?? undefined);
  const composer = useComposer({
    context: "chat",
    mode,
    onModeChange: setMode,
    chatId: id,
    initialModels: chatModels,
    busy: running,
    onSend: (payload) => {
      if (mobile && missed.length) {
        setSheetOpen(true);
        return false;
      }
      return doSend(payload);
    },
    voiceText: mode === "best" ? DEMO_VOICE.best : DEMO_VOICE.compare,
    placeholder:
      mode === "best"
        ? {
            desktop: tco("placeholder.followUp"),
            mobile: tco("placeholder.followUp"),
          }
        : {
            desktop: tco("placeholder.followUpAll", {
              count: n(chatModels?.length ?? 3),
            }),
            mobile: tco("placeholder.followUpAllMobile", {
              count: n(chatModels?.length ?? 3),
            }),
          },
    initial: params?.composer,
    initialSheet: params?.sheet,
  });
  const catchUpCredits =
    Math.round(
      (composer.estimate?.catchUp ?? []).reduce((s, c) => s + c.credits, 0) *
        10,
    ) / 10;

  // ---- Names and copy helpers.
  const spec = (m: ModelId) => MODEL_SPECS[m];
  const copy = (text?: string) => {
    if (text) void navigator.clipboard?.writeText(text).catch(() => {});
  };
  const metricList = (a: Answer) => [
    t("metric.seconds", { value: secs((a.durationMs ?? 0) / 1000) }),
    t("metric.tokens", { value: n(a.tokens) }),
    tc("creditsShort", { amount: cr(a.credits) }),
  ];
  const failedText = (a: Answer) =>
    t(
      a.failure === "unavailable"
        ? "card.unavailable"
        : a.failure === "timeout"
          ? "card.timeout"
          : a.failure === "stopped"
            ? "card.stopped"
            : "card.error",
      { name: spec(a.model).short, provider: spec(a.model).provider },
    );
  const badgeTone = (tag?: AnswerTag): BadgeTone =>
    tag === "fastestCheapest"
      ? "success"
      : tag === "retried" || tag === "caughtUp"
        ? "neutral"
        : "info";
  const continueWith = (a: Answer) => {
    composer.setModels([a.model]);
    setMode("compare");
  };

  const cardProps = (a: Answer, height: string): AnswerCardProps => {
    const failed = isFailed(a);
    const m = spec(a.model);
    const tag = tags.get(a.id);
    return {
      state: failed ? "failed" : tag === "suggested" ? "suggested" : "default",
      model: a.model,
      modelName: m.name,
      provider: m.provider,
      children: failed ? failedText(a) : a.text,
      metrics: failed || isOpen(a) ? [] : metricList(a),
      badge: failed ? t("badge.failed") : tag ? t(`badge.${tag}`) : undefined,
      badgeTone: badgeTone(tag),
      refund: failed ? t("card.refunded", { credits: n(0) }) : undefined,
      sizeClassName: cx(
        height,
        "w-answer-card-width shrink-0 snap-start md:max-xl:w-[calc((100%-var(--space-4))/2)] xl:w-auto",
      ),
      labels: {
        close: t("card.close"),
        copy: t("card.copy"),
        retry: t("card.retry"),
        helpful: t("card.helpful"),
        notHelpful: t("card.notHelpful"),
        continue: t.rich("card.continue", {
          logo: () => <ModelOrb model={a.model} size="md" aria-hidden />,
        }),
        continueLabel: t("card.continueLabel", { name: m.short }),
        swapModel: t("card.swapModel"),
        retryWithCost: t("card.retryWithCost", {
          credits: cr(retryCredits(a.model)),
        }),
      },
      onCopy: () => copy(a.text),
      onContinue: () => continueWith(a),
      onRetry: () => (failed ? retryAnswer(a) : undefined),
      onSwapModel: () => swapAnswer(a),
    };
  };

  // ---- Thinking rows.
  const rowsData = current ? thinkingRows(answers, current.createdAt, now) : [];
  const rowLabel = (
    status: ThinkingRow["status"],
    seconds = 0,
    short = false,
  ) =>
    ({
      done: t("status.done", { seconds: secs(seconds) }),
      writing: t("status.writing"),
      slow: short ? t("status.slowShort") : t("status.slow"),
      unresponsive: t("status.unresponsive"),
      "catching-up": short
        ? t("status.catchingUpShort")
        : t("status.catchingUp"),
    })[status];
  const rows = (short: boolean): ThinkingRow[] =>
    rowsData.map((r) => ({
      model: r.answer.model,
      name: short ? spec(r.answer.model).short : spec(r.answer.model).name,
      status: r.status,
      statusLabel: rowLabel(r.status, r.seconds, short),
    }));
  const thinkingTitle =
    rowsData.length === 1
      ? t("thinking.titleOne", { name: spec(rowsData[0].answer.model).short })
      : t("thinking.title", { count: n(rowsData.length) });
  const catchingUp = rowsData.filter((r) => r.status === "catching-up");
  const slowCount = rowsData.filter((r) => r.status === "slow").length;
  const catchUpNames = list(catchingUp.map((r) => spec(r.answer.model).short));
  const statusMessage =
    slowCount > 0
      ? t("thinking.slow", { count: n(slowCount) })
      : catchingUp.length
        ? t("thinking.catchUp", { names: catchUpNames })
        : t("thinking.progress", {
            done: n(rowsData.filter((r) => r.status === "done").length),
            total: n(rowsData.length),
          });
  const mobileBody =
    slowCount > 0
      ? t("thinking.slowMobile")
      : catchingUp.length
        ? t("thinking.catchUpMobile", { names: catchUpNames })
        : t("thinking.bodyMobile");

  // ---- Suggestion bar and receipt for the answers screens.
  const suggested = answers.find((a) => tags.get(a.id) === "suggested");
  const caughtUp = answers.filter((a) => tags.get(a.id) === "caughtUp");
  let suggestion: ReactNode = null;
  if (current && !thinking && !showBest) {
    const bar = (
      title: string,
      message: string,
      why: string,
      onWhy?: () => void,
    ) => (
      <SuggestionBar
        models={tabOrder(answers).map((a) => a.model)}
        title={title}
        message={message}
        whyLabel={why}
        onWhy={onWhy}
        className="max-w-full"
      />
    );
    const retryAll = () => missed.forEach((a) => retryAnswer(a));
    const retryCost = missed.reduce((s, a) => s + retryCredits(a.model), 0);
    if (missed.length && !running) {
      const partial = t("suggestion.partial", {
        answered: n(answered.length),
        total: n(answers.length),
      });
      const timedOut = missed.find((a) => a.failure === "timeout");
      const down = missed.find((a) => a.failure === "unavailable");
      suggestion =
        missed.length === 2 && timedOut && down
          ? bar(
              partial,
              t("suggestion.failedBoth", {
                timedOut: spec(timedOut.model).short,
                unavailable: spec(down.model).short,
              }),
              t("suggestion.retryBoth", { credits: cr(retryCost) }),
              retryAll,
            )
          : missed.length === 1 && down
            ? bar(
                partial,
                t("suggestion.stillUnavailable", {
                  name: spec(down.model).short,
                }),
                t("suggestion.swap", { name: spec(down.model).short }),
                () => swapAnswer(down),
              )
            : missed.length === 1
              ? bar(
                  partial,
                  t("suggestion.failedOne", {
                    name: spec(missed[0].model).short,
                  }),
                  t("card.retryWithCost", { credits: cr(retryCost) }),
                  retryAll,
                )
              : bar(
                  partial,
                  t("suggestion.failedMany", {
                    names: list(missed.map((a) => spec(a.model).short)),
                  }),
                  t("suggestion.retryAll", { credits: cr(retryCost) }),
                  retryAll,
                );
    } else if (answered.length > 1 && caughtUp.length && suggested) {
      suggestion = bar(
        t("suggestion.ready", { count: answered.length }),
        t("suggestion.independent", {
          names: list(caughtUp.map((a) => spec(a.model).short)),
          name: spec(suggested.model).short,
        }),
        t("suggestion.why"),
      );
    } else if (answered.length > 1) {
      suggestion = bar(
        t("suggestion.ready", { count: answered.length }),
        suggested
          ? t("suggestion.suggests", { name: spec(suggested.model).short })
          : "",
        t("suggestion.why"),
      );
    }
  }

  const credits = current ? promptCredits(current, answers) : 0;
  const cheap = answered.reduce<Answer | undefined>(
    (min, a) => (!min || a.credits < min.credits ? a : min),
    undefined,
  );
  const receipt = (() => {
    if (missed.length)
      return {
        summary: t("receipt.answers", {
          count: answered.length,
          credits: cr(credits),
          money: money(credits),
        }),
        detail: t("receipt.refunded", {
          names: list(missed.map((a) => spec(a.model).short)),
        }),
      };
    const catchUp = answers.reduce((s, a) => s + a.catchUpCredits, 0);
    return {
      summary: t("receipt.models", {
        count: answers.length,
        credits: cr(credits),
        money: money(credits),
      }),
      detail: caughtUp.length
        ? t("receipt.catchUp", {
            credits: cr(Math.round(catchUp * 10) / 10),
            names: list(caughtUp.map((a) => spec(a.model).short)),
          })
        : cheap && answers.length > 1
          ? t("receipt.cheapest", {
              name: spec(cheap.model).short,
              credits: cr(cheap.credits),
            })
          : undefined,
    };
  })();

  /** The Best answer card of a prompt (the current one, or an earlier one in the thread). */
  const bestCard = (p: Prompt, onSeeAll: () => void) => {
    const b = p.best!;
    const pAnswers = visibleAnswers(p);
    const models = pAnswers
      .filter((a) => a.status === "done")
      .map((a) => a.model);
    return (
      <BestAnswerCard
        className="mx-auto mt-4 max-w-chat-column"
        models={models}
        title={t("best.title")}
        builtFrom={t("best.builtFrom", {
          names: list(models.map((m) => MODELS[m].name)),
        })}
        intro={b.intro}
        points={b.points.map((pt) => ({
          lead: t("best.lead", { name: pt.lead }),
          text: pt.text,
          model: pt.model,
          source: t("best.source", { name: MODELS[pt.model].name }),
        }))}
        metrics={
          b.status === "done"
            ? [
                t("metric.seconds", {
                  value: secs((b.durationMs ?? 0) / 1000),
                }),
                tc("creditsShort", { amount: cr(b.credits) }),
                tc("money", { amount: money(b.credits) }),
              ]
            : []
        }
        seeAllLabel={t("best.seeAll", { count: n(pAnswers.length) })}
        whyLabel={t("best.why")}
        onSeeAll={onSeeAll}
      />
    );
  };

  // ---- Earlier prompts (desktop): a scrolling thread. Each turn is open by default (its prompt and
  // its answer: the Best answer card or the answer cards) and folds to Figma's Prompt summary row.
  // Figma folds earlier prompts; the product owner asked to feel a 2–4 prompt conversation and its
  // scrolling, so they start open.
  const grid =
    "flex snap-x gap-4 overflow-x-auto pb-1 xl:grid xl:grid-cols-3 xl:overflow-visible";
  // Tablet: which answer is first on screen in the sideways-scrolling row (for the pager).
  const [firstShown, setFirstShown] = useState(0);
  const onGridScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const row = e.currentTarget;
    const card = row.firstElementChild as HTMLElement | null;
    if (!card) return;
    const step =
      card.offsetWidth + parseFloat(getComputedStyle(row).columnGap || "0");
    setFirstShown(Math.round(row.scrollLeft / step));
  };
  const [folded, setFolded] = useState<string[]>([]);
  const [allFor, setAllFor] = useState<string[]>([]);
  const summaries = earlier.map((p) => {
    const open = !folded.includes(p.id);
    const pAnswers = visibleAnswers(p);
    const asBest = p.mode === "best" && !!p.best && !allFor.includes(p.id);
    return (
      <div key={p.id} className="flex flex-col gap-3">
        <PromptSummary
          label={t("summary.label", { n: n(p.seq) })}
          prompt={p.text}
          results={tabOrder(pAnswers).map((a) => ({
            model: a.model,
            label:
              a.status === "done"
                ? t("summary.result", {
                    name: spec(a.model).short,
                    credits: cr(a.credits),
                  })
                : t("summary.refunded", { name: spec(a.model).short }),
            refunded: a.status !== "done",
          }))}
          toggleLabel={open ? t("summary.hide") : t("summary.show")}
          expanded={open}
          onToggle={() =>
            setFolded((s) =>
              open ? [...s, p.id] : s.filter((x) => x !== p.id),
            )
          }
        />
        {open && (
          <>
            <PromptBubble className="self-end">{p.text}</PromptBubble>
            {asBest ? (
              bestCard(p, () => setAllFor((s) => [...s, p.id]))
            ) : (
              <div className={grid}>
                {pAnswers.map((a) => (
                  <AnswerCard key={a.id} {...cardProps(a, "h-chat-card")} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  });

  const showRecipients =
    !!current && !running && missed.length > 0 && answered.length > 0;
  const cardHeight =
    showRecipients && composer.value.trim()
      ? "h-chat-card-short"
      : current && current.seq > 1
        ? "h-chat-card"
        : "h-chat-card-tall";

  const best = current?.best;
  const bestModels = answered.map((a) => a.model);

  const bestThinking = current?.mode === "best" && mode === "best" && thinking;

  // A new prompt in a conversation scrolls into view (the thread above stays reachable).
  const currentRef = useRef<HTMLDivElement>(null);
  const lastScrolled = useRef<string | null>(null);
  useEffect(() => {
    if (!current || current.seq < 2 || lastScrolled.current === current.id)
      return;
    lastScrolled.current = current.id;
    currentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [current]);

  // ======================================================================== Desktop
  const desktop = current && (
    <div className="flex flex-col gap-10 max-md:hidden">
      {summaries}
      <div
        ref={currentRef}
        className={cx(
          "scroll-mt-24 flex flex-col",
          current.seq > 1 ? "gap-3" : "gap-4",
        )}
      >
        <PromptBubble className="self-end">{current.text}</PromptBubble>
        {bestThinking && (
          <ThinkingPanel
            className="mx-auto mt-4 max-w-chat-column"
            title={thinkingTitle}
            body={t("thinking.body")}
            rows={rows(false)}
            stopLabel={t("thinking.stop")}
            stopNote={t("thinking.stopNote")}
            onStop={onStop}
          />
        )}
        {showBest &&
          !bestThinking &&
          best &&
          bestCard(current, () => setMode("compare"))}
        {thinking && !bestThinking && (
          <>
            <ThinkingStatusBar
              className="self-start"
              title={thinkingTitle}
              message={statusMessage}
              stopLabel={t("thinking.stop")}
              onStop={onStop}
            />
            <div className={grid}>
              {answers.map((a) => {
                const row = rowsData.find((r) => r.answer.id === a.id)!;
                return row.status === "done" || isFailed(a) ? (
                  <AnswerCard
                    key={a.id}
                    {...cardProps(a, "h-chat-card-tall")}
                  />
                ) : (
                  <WritingCard
                    key={a.id}
                    model={a.model}
                    modelName={spec(a.model).name}
                    provider={spec(a.model).provider}
                    status={rowLabel(row.status)}
                    sizeClassName="h-chat-card-tall w-answer-card-width shrink-0 snap-start md:max-xl:w-[calc((100%-var(--space-4))/2)] xl:w-auto"
                  />
                );
              })}
            </div>
          </>
        )}
        {!thinking && !showBest && (
          <>
            {suggestion && <div className="flex">{suggestion}</div>}
            <div className={grid} onScroll={onGridScroll}>
              {answers.map((a) => (
                <AnswerCard key={a.id} {...cardProps(a, cardHeight)} />
              ))}
            </div>
            {answers.length > 2 && (
              // Tablet (Figma 04b · Compare): two answers on screen, a pager for the rest.
              <div className="hidden md:max-xl:block">
                <AnswerPager
                  count={answers.length - 1}
                  index={firstShown}
                  hint={
                    firstShown + 2 < answers.length
                      ? t("tablet.pager", {
                          name: spec(answers[firstShown + 2].model).short,
                          total: n(answers.length),
                        })
                      : t("tablet.pagerBack", {
                          name: spec(answers[0].model).short,
                          total: n(answers.length),
                        })
                  }
                  label={t("mobile.page", {
                    n: n(firstShown + 1),
                    total: n(answers.length - 1),
                  })}
                />
              </div>
            )}
            {!running && (
              <PromptReceipt
                summary={receipt.summary}
                detail={receipt.detail}
              />
            )}
          </>
        )}
      </div>
    </div>
  );

  // ======================================================================== Mobile
  const tabs = tabOrder(answers);
  const [tabPick, setTab] = useState<ModelId | undefined>(params?.tab);
  const tab =
    tabs.find((a) => a.model === tabPick)?.model ??
    (missed.length ? missed[0]?.model : suggested?.model) ??
    tabs[0]?.model;
  const tabIndex = Math.max(
    0,
    tabs.findIndex((a) => a.model === tab),
  );
  const currentTab = tabs[tabIndex];
  const touch = useRef<number | null>(null);
  const swipe = (dir: number) =>
    setTab(tabs[(tabIndex + dir + tabs.length) % tabs.length].model);

  const tabCaption = (a: Answer): Pick<ModelTab, "caption" | "tone"> => {
    const tag = tags.get(a.id);
    if (isFailed(a)) return { caption: t("mobile.tab.failed"), tone: "error" };
    if (isOpen(a)) return { caption: t("status.writing") };
    if (current?.seq === 1) {
      if (tag === "suggested")
        return { caption: t("mobile.tab.suggested"), tone: "info" };
      if (tag === "fastestCheapest")
        return { caption: t("mobile.tab.cheapest"), tone: "success" };
      return { caption: t("mobile.tab.cost", { credits: cr(a.credits) }) };
    }
    if (tag === "retried") return { caption: t("mobile.tab.answeredNow") };
    if (tag === "caughtUp") return { caption: t("mobile.tab.caughtUp") };
    return { caption: t("mobile.tab.answered") };
  };

  const mobileNote = (a: Answer) => {
    switch (tags.get(a.id)) {
      case "suggested":
        return { tone: "info" as const, text: t("mobile.note.suggested") };
      case "only":
        return {
          tone: "info" as const,
          text: t("mobile.note.only", { count: n(missed.length) }),
        };
      case "fastestCheapest":
        return {
          tone: "success" as const,
          text: t("mobile.note.fastestCheapest"),
        };
      case "caughtUp":
        return { tone: "success" as const, text: t("mobile.note.caughtUp") };
      case "retried":
        return { tone: "info" as const, text: t("mobile.note.retried") };
      default:
        return undefined;
    }
  };

  const mobileCard = (a: Answer): MobileAnswerCardProps => {
    const m = spec(a.model);
    if (isFailed(a)) {
      const kind =
        a.failure === "unavailable"
          ? "unavailable"
          : a.failure === "timeout"
            ? "timeout"
            : a.failure === "stopped"
              ? "stopped"
              : "error";
      const askDifferent = {
        label: t("mobile.failed.askDifferent"),
        onClick: () => swapAnswer(a),
      };
      const tryAgain = {
        label: t("mobile.failed.tryAgain", {
          credits: cr(retryCredits(a.model)),
        }),
        icon: "reload" as const,
        onClick: () => retryAnswer(a),
      };
      return {
        state: "failed",
        id: `answer-${a.model}`,
        model: a.model,
        title: t(`mobile.failed.${kind}Title`, { name: m.short }),
        body: t(`mobile.failed.${kind}Body`, { provider: m.provider }),
        refund: t("mobile.failed.notCharged"),
        actions:
          kind === "unavailable"
            ? [
                { ...askDifferent, tone: "tinted" },
                {
                  label: t("mobile.failed.tryLater"),
                  icon: "reload",
                  tone: "secondary",
                  onClick: () => setTab(answered[0]?.model ?? tab),
                },
              ]
            : [
                { ...tryAgain, tone: "tinted" },
                { ...askDifferent, tone: "secondary" },
              ],
      };
    }
    return {
      id: `answer-${a.model}`,
      model: a.model,
      modelName: m.name,
      meta: isOpen(a)
        ? t("status.writing")
        : t("mobile.meta", {
            seconds: secs((a.durationMs ?? 0) / 1000),
            credits: cr(a.credits),
            money: money(a.credits),
          }),
      note: mobileNote(a),
      suggested: tags.get(a.id) === "suggested" || tags.get(a.id) === "only",
      children: a.text,
      labels: {
        copy: t("card.copy"),
        helpful: t("card.helpful"),
        notHelpful: t("card.notHelpful"),
        use: t("mobile.use"),
      },
      onCopy: () => copy(a.text),
      onUse: () => continueWith(a),
    };
  };

  const hint = (() => {
    if (!missed.length)
      return current?.seq === 1
        ? t("mobile.hint.swipe")
        : t("mobile.hint.all", { total: n(tabs.length) });
    const counts = { answered: n(answered.length), total: n(tabs.length) };
    return currentTab && isFailed(currentTab) && answered[0]
      ? t("mobile.hint.partialTo", {
          ...counts,
          name: spec(answered[0].model).short,
        })
      : t("mobile.hint.partial", counts);
  })();

  const mobileView = current && (
    <div className="flex flex-col md:hidden">
      {(thinking || showBest) && <MobilePrompt prompt={current.text} />}
      {thinking && (
        <ThinkingPanel
          layout="mobile"
          className="mt-5"
          title={thinkingTitle}
          body={mobileBody}
          rows={rows(true)}
        />
      )}
      {!thinking && showBest && best && (
        <MobileBestAnswer
          className="mt-4"
          models={bestModels}
          title={t("best.title")}
          subtitle={t("best.fromCount", { count: n(answered.length) })}
          intro={best.intro}
          ideas={best.points.map((p) => ({
            name: p.lead,
            model: p.model,
            source: t("best.source", { name: spec(p.model).short }),
            text: p.text,
          }))}
          cost={t("best.cost", { credits: cr(best.credits) })}
          money={t("best.money", { amount: money(best.credits) })}
          labels={{
            copy: t("card.copy"),
            share: tc("share"),
            helpful: t("card.helpful"),
            notHelpful: t("card.notHelpful"),
            seeAll: t("best.seeAllMobile", { count: n(answers.length) }),
          }}
          onCopy={() =>
            copy(
              [
                best.intro,
                ...best.points.map((i) => `${i.lead}: ${i.text}`),
              ].join("\n"),
            )
          }
          onSeeAll={() => setMode("compare")}
        />
      )}
      {!thinking && !showBest && currentTab && (
        <>
          <MobilePrompt
            variant="line"
            label={t("mobile.youAsked")}
            prompt={current.text}
          />
          <ModelTabs
            className="mt-3"
            label={t("mobile.tabs")}
            value={tab ?? ""}
            onValueChange={(v) => setTab(v as ModelId)}
            tabs={tabs.map((a) => ({
              value: a.model,
              model: a.model,
              name: spec(a.model).short,
              panelId: `answer-${a.model}`,
              ...tabCaption(a),
            }))}
          />
          <div
            role="tabpanel"
            aria-label={spec(currentTab.model).short}
            className="mt-2"
            onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touch.current === null) return;
              const dx = e.changedTouches[0].clientX - touch.current;
              touch.current = null;
              if (Math.abs(dx) > 48) swipe(dx < 0 ? 1 : -1);
            }}
          >
            <MobileAnswerCard {...mobileCard(currentTab)} />
          </div>
          <AnswerPager
            className="mt-3"
            count={tabs.length}
            index={tabIndex}
            hint={hint}
            label={t("mobile.page", {
              n: n(tabIndex + 1),
              total: n(tabs.length),
            })}
          />
        </>
      )}
    </div>
  );

  // ======================================================================== Chrome
  const title = chat?.title ?? "";
  const recipientOptions = answered.map((a) => a.model);
  const composerSlot = (
    <>
      {thinking ? (
        <ThinkingStop
          className="md:hidden"
          label={t("thinking.stop")}
          note={t("thinking.stopNote")}
          onStop={onStop}
        />
      ) : (
        <div className="md:hidden">{composer.mobileComposer}</div>
      )}
      <div className="max-md:hidden">
        {showRecipients && composer.value.trim() && (
          <FollowUpRecipients
            className="mb-2"
            message={t("recipients.message")}
            options={[
              {
                value: "all",
                label: t("recipients.all", {
                  count: n(composer.models.length),
                }),
                note: t("recipients.allNote"),
              },
              ...recipientOptions.map((m) => ({
                value: m,
                label: t("recipients.only", { name: spec(m).short }),
              })),
            ]}
            value={recipient}
            onValueChange={(v) => setRecipient(v as typeof recipient)}
            cost={
              recipient === "all" && catchUpCredits > 0
                ? t("recipients.catchUp", { credits: cr(catchUpCredits) })
                : undefined
            }
          />
        )}
        <Composer {...composer.desktopProps} />
        {/* Figma lets the footnote sit in the composer area’s bottom padding. */}
        <p className="mt-1 -mb-3 text-center type-caption text-ink-3">
          {tc("footnote")}
        </p>
      </div>
    </>
  );

  if (load === "not-found") notFound();

  const estimateMax = composer.estimate?.maxCredits ?? 0;
  return (
    <>
      <ChatTopBar
        className="absolute inset-x-0 top-3 z-10 max-md:hidden md:pr-6 md:pl-16 lg:px-0"
        title={title}
        titleMenuLabel={t("titleMenu")}
        shareLabel={tc("share")}
        moreLabel={tc("more")}
      />
      <MobileTopBar
        className="shrink-0 md:hidden"
        title={title}
        back={{ label: t("back"), link: <Link href="/chats" /> }}
        actions={[
          ...(showBest
            ? [{ icon: "share-01" as const, label: tc("share") }]
            : []),
          { icon: "more-horizontal" as const, label: tc("more") },
        ]}
      />
      <AppMain className="max-md:pt-1" composer={chat ? composerSlot : null}>
        <div className="w-full px-4 pb-6 md:px-0">
          {load === "error" ? (
            <EmptyState
              icon="bubble-chat"
              title={t("loadError")}
              body={t("loadErrorBody")}
              action={
                <Button variant="secondary" size="sm" onClick={() => reload()}>
                  {t("tryAgain")}
                </Button>
              }
            />
          ) : (
            <>
              {desktop}
              {mobileView}
            </>
          )}
        </div>
      </AppMain>
      {composer.overlays}
      <RecipientsSheet
        open={sheetOpen && mobile}
        onOpenChange={setSheetOpen}
        title={t("recipients.title")}
        description={t("recipients.question", { prompt: composer.value })}
        value={recipient}
        onValueChange={(v) => setRecipient(v as typeof recipient)}
        choices={[
          {
            value: "all",
            models: tabOrder(answers).map((a) => a.model),
            title: t("recipients.allAis", { count: n(composer.models.length) }),
            description: t("recipients.allBody"),
            cost: t("recipients.cost", {
              credits: cr(estimateMax),
              money: money(estimateMax),
            }),
          },
          ...answered.map((a) => ({
            value: a.model,
            models: [a.model],
            title: t("recipients.only", { name: spec(a.model).short }),
            description: t("recipients.onlyBody"),
            cost: t("recipients.cost", {
              credits: cr(retryCredits(a.model)),
              money: money(retryCredits(a.model)),
            }),
          })),
        ]}
        note={t("recipients.note")}
        sendLabel={t("recipients.send")}
        onSend={async () => {
          setSheetOpen(false);
          const text = composer.value.trim();
          if (!text) return;
          const ok = await doSend({
            text,
            models: composer.models,
            attachments: [],
          });
          if (ok) composer.setValue("");
        }}
      />
    </>
  );
}
