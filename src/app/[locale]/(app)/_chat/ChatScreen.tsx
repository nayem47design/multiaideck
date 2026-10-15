"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import type { BadgeTone } from "@/components/atoms/Badge";
import { cx } from "@/components/atoms/states";
import { AnswerPager } from "@/components/molecules/AnswerPager";
import { FollowUpRecipients } from "@/components/molecules/FollowUpRecipients";
import { MobilePrompt } from "@/components/molecules/MobilePrompt";
import { ModelTabs, type ModelTab } from "@/components/molecules/ModelTabs";
import { PromptBubble } from "@/components/molecules/PromptBubble";
import { PromptReceipt } from "@/components/molecules/PromptReceipt";
import { PromptSummary } from "@/components/molecules/PromptSummary";
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
import { MODELS } from "@/lib/ai/models";
import { Link, useRouter } from "@/lib/i18n/navigation";
import {
  COFFEE_CHAT,
  COFFEE_CHAT_ID,
  DEMO_NEXT_PROMPT,
  DEMO_VOICE,
  cheapest,
  findChat,
  modelInfo,
  promptCredits,
  simpleChat,
  type AnswerModel,
  type DemoAnswer,
  type DemoPrompt,
} from "@/lib/mock/chat";

import {
  AFTER_THINKING,
  CARD_ORDER,
  TAB_ORDER,
  coffeeStep,
  defaultTab,
  thinkingRows,
  type StepData,
} from "./script";
import {
  SIMPLE_STEPS,
  STEPS,
  isThinking,
  modeOf,
  parseParams,
  stepQuery,
  type ChatParams,
  type Step,
} from "./state";
import { useComposer } from "./useComposer";
import { useChatFormat } from "./useFormat";
import { useIsMobile } from "@/lib/hooks/useMedia";

// A chat (/c/[id]): every desktop and mobile state of the prototype's ask-and-compare flow. The
// coffee-shop chat is scripted step by step (see ./state.ts for the steps and deep links); the
// other demo chats show one prompt in Best answer or Compare.

const THINK_PHASE_MS = 1300;
const THINK_DONE_MS = 2800;

function defaultStep(id: string): Step {
  if (id === COFFEE_CHAT_ID) return "prompt-3";
  return findChat(id)?.kind === "best" ? "best" : "compare";
}

/** Reads the step from ?state= (and the other deep-link params); render inside <Suspense>. */
export function ChatRoute({ id }: { id: string }) {
  const sp = useSearchParams();
  const allowed = id === COFFEE_CHAT_ID ? STEPS : SIMPLE_STEPS;
  const params = parseParams(
    new URLSearchParams(sp.toString()),
    defaultStep(id),
    allowed,
  );
  const key = [params.step, params.retried, params.only, params.tab].join("|");
  return <ChatScreen key={key} id={id} params={params} />;
}

export function ChatScreen({
  id,
  params = { step: defaultStep(id), retried: false, hold: false },
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
  const chat = findChat(id)!;
  const coffee = id === COFFEE_CHAT_ID;
  const { step, retried, only, hold } = params;

  const data: StepData = coffee
    ? coffeeStep(params)
    : { prompt: simpleChat(id)!.prompt, n: 1, best: simpleChat(id)!.best };
  const { prompt, previous } = data;
  const mode = modeOf(step);
  const thinking = isThinking(step);
  const who = step === "prompt-3-who";

  // ---- Moving between steps (the URL keeps the step, so Back and deep links work).
  const href = (s: Step, extra: Parameters<typeof stepQuery>[1] = {}) =>
    `/c/${id}${stepQuery(s, extra)}`;
  const go = (
    s: Step,
    extra: Parameters<typeof stepQuery>[1] = {},
    replace = false,
  ) =>
    window.history[replace ? "replaceState" : "pushState"](
      null,
      "",
      stepQuery(s, extra),
    );
  const keep = { retried: retried || step === "prompt-2-retry" };

  // ---- Thinking: one AI finishes, then the answers replace the thinking screen.
  const [phase, setPhase] = useState(0);
  const next = AFTER_THINKING[step];
  useEffect(() => {
    if (!thinking || hold || !next) return;
    const a = setTimeout(() => setPhase(1), THINK_PHASE_MS);
    const b = setTimeout(
      () => go(next, { retried, only }, true),
      THINK_DONE_MS,
    );
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
    // Runs once per step: the screen remounts when the step changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stop = () => {
    if (step === "thinking-2") go("compare");
    else if (step === "thinking-3") go("prompt-2", { ...keep, tab: "claude" });
    else router.push("/");
  };

  // ---- Follow-up recipients (prompt 3 after a partial prompt 2).
  const [recipient, setRecipient] = useState<"all" | AnswerModel>("all");
  const answered = prompt.answers.filter((a) => a.text);
  const missed = prompt.answers.filter((a) => !a.text);

  const send = () => {
    if (!coffee)
      return go(mode === "best" ? "thinking-best" : "thinking-compare");
    if (step === "prompt-2" || step === "prompt-2-retry")
      return go("prompt-3-who", keep);
    if (who)
      return go("thinking-3", {
        ...keep,
        only: recipient === "all" ? undefined : recipient,
      });
    if (step === "compare" || step === "thinking-compare")
      return go("thinking-2");
    go(mode === "best" ? "thinking-best" : "thinking-compare");
  };

  const composer = useComposer({
    context: "chat",
    mode,
    onModeChange: (m) => go(m === "best" ? "best" : "compare"),
    onSend: send,
    voiceText: mode === "best" ? DEMO_VOICE.best : DEMO_VOICE.compare,
    placeholder:
      mode === "best"
        ? {
            desktop: tco("placeholder.followUp"),
            mobile: tco("placeholder.followUp"),
          }
        : {
            desktop: tco("placeholder.followUpAll", { count: n(3) }),
            mobile: tco("placeholder.followUpAllMobile", { count: n(3) }),
          },
    estimate: { min: 2, max: 4 },
    initial: params.composer,
    initialSheet: params.sheet,
    initialValue: who ? DEMO_NEXT_PROMPT : "",
  });

  // ---- Names and copy helpers.
  const info = (m: AnswerModel) => modelInfo(m);
  const copy = (text?: string) => {
    if (text) void navigator.clipboard?.writeText(text).catch(() => {});
  };
  const metricList = (a: DemoAnswer) => [
    t("metric.seconds", { value: secs(a.seconds ?? 0) }),
    t("metric.tokens", { value: n(a.tokens ?? 0) }),
    tc("creditsShort", { amount: cr(a.credits ?? 0) }),
  ];
  const failedText = (a: DemoAnswer) =>
    t(a.failure === "unavailable" ? "card.unavailable" : "card.timeout", {
      name: info(a.model).short,
      provider: info(a.model).provider,
    });
  const badgeTone = (a: DemoAnswer): BadgeTone =>
    a.tag === "fastestCheapest"
      ? "success"
      : a.tag === "retried" || a.tag === "caughtUp"
        ? "neutral"
        : "info";

  const retryAnswer = (a: DemoAnswer) => {
    if (coffee && a.model === "gpt" && (step === "prompt-2" || who))
      go("prompt-2-retry", { tab: "gpt" });
  };

  const cardProps = (a: DemoAnswer, height: string): AnswerCardProps => {
    const failed = !a.text;
    const m = info(a.model);
    return {
      state: failed
        ? "failed"
        : a.tag === "suggested"
          ? "suggested"
          : "default",
      model: a.model,
      modelName: m.name,
      provider: m.provider,
      children: failed ? failedText(a) : a.text,
      metrics: failed ? [] : metricList(a),
      badge: failed
        ? t("badge.failed")
        : a.tag
          ? t(`badge.${a.tag}`)
          : undefined,
      badgeTone: badgeTone(a),
      refund: failed ? t("card.refunded", { credits: n(0) }) : undefined,
      sizeClassName: cx(
        height,
        "w-answer-card-width shrink-0 snap-start xl:w-auto",
      ),
      labels: {
        close: t("card.close"),
        copy: t("card.copy"),
        retry: t("card.retry"),
        helpful: t("card.helpful"),
        notHelpful: t("card.notHelpful"),
        continue: t("card.continue", { name: m.short }),
        swapModel: t("card.swapModel"),
        retryWithCost: t("card.retryWithCost", {
          credits: cr(a.retryCredits ?? 0),
        }),
      },
      onCopy: () => copy(a.text),
      onContinue: () => go("best"),
      onRetry: () => (failed ? retryAnswer(a) : undefined),
      onSwapModel: composer.openPicker,
    };
  };

  const ordered = (p: DemoPrompt, order: AnswerModel[]) =>
    order
      .map((m) => p.answers.find((a) => a.model === m))
      .filter((a): a is DemoAnswer => !!a);

  // ---- Thinking rows.
  const rowsData = thinkingRows(step, phase, only).filter((r) =>
    prompt.answers.some((a) => a.model === r.model),
  );
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
      model: r.model,
      name: short ? info(r.model).short : info(r.model).name,
      status: r.status,
      statusLabel: rowLabel(r.status, r.seconds, short),
    }));
  const thinkingTitle =
    rowsData.length === 1
      ? t("thinking.titleOne", { name: info(rowsData[0].model).short })
      : t("thinking.title", { count: n(rowsData.length) });
  const catchUpNames = list(
    rowsData
      .filter((r) => r.status === "catching-up")
      .map((r) => info(r.model).short),
  );
  const statusMessage =
    step === "thinking-2"
      ? t("thinking.slow", { count: n(2) })
      : step === "thinking-3" && rowsData.length > 1
        ? t("thinking.catchUp", { names: catchUpNames })
        : t("thinking.progress", {
            done: n(rowsData.filter((r) => r.status === "done").length),
            total: n(rowsData.length),
          });
  const mobileBody =
    step === "thinking-2"
      ? t("thinking.slowMobile")
      : step === "thinking-3" && rowsData.length > 1
        ? t("thinking.catchUpMobile", { names: catchUpNames })
        : t("thinking.bodyMobile");

  // ---- Suggestion bar and receipt for the answers screens.
  const suggested = prompt.answers.find((a) => a.tag === "suggested");
  const missedNames = list(missed.map((a) => info(a.model).short));
  let suggestion: ReactNode = null;
  if (!thinking && mode === "compare") {
    const bar = (
      title: string,
      message: string,
      why: string,
      onWhy?: () => void,
    ) => (
      <SuggestionBar
        models={TAB_ORDER.filter((m) =>
          prompt.answers.some((a) => a.model === m),
        )}
        title={title}
        message={message}
        whyLabel={why}
        onWhy={onWhy}
        className="max-w-full"
      />
    );
    if (missed.length && step !== "prompt-3") {
      const partial = t("suggestion.partial", {
        answered: n(answered.length),
        total: n(prompt.answers.length),
      });
      const timedOut = missed.find((a) => a.failure === "timeout");
      const down = missed.find((a) => a.failure === "unavailable");
      suggestion =
        timedOut && down
          ? bar(
              partial,
              t("suggestion.failedBoth", {
                timedOut: info(timedOut.model).short,
                unavailable: info(down.model).short,
              }),
              t("suggestion.retryBoth", {
                credits: cr(
                  missed.reduce((s, a) => s + (a.retryCredits ?? 0), 0),
                ),
              }),
              () => go("prompt-2-retry", { tab: "gpt" }),
            )
          : down
            ? bar(
                partial,
                t("suggestion.stillUnavailable", {
                  name: info(down.model).short,
                }),
                t("suggestion.swap", { name: info(down.model).short }),
                composer.openPicker,
              )
            : null;
    } else if (step === "prompt-3" && answered.length > 1 && suggested) {
      suggestion = bar(
        t("suggestion.ready", { count: answered.length }),
        t("suggestion.independent", {
          names: list(
            prompt.answers
              .filter((a) => a.tag === "caughtUp")
              .map((a) => info(a.model).short),
          ),
          name: info(suggested.model).short,
        }),
        t("suggestion.why"),
      );
    } else if (answered.length > 1) {
      suggestion = bar(
        t("suggestion.ready", { count: answered.length }),
        suggested
          ? t("suggestion.suggests", { name: info(suggested.model).short })
          : "",
        t("suggestion.why"),
      );
    }
  }

  const credits = promptCredits(prompt);
  const cheap = cheapest(prompt);
  const receipt = (() => {
    if (missed.length)
      return {
        summary: t("receipt.answers", {
          count: answered.length,
          credits: cr(credits),
          money: money(credits),
        }),
        detail: t("receipt.refunded", { names: missedNames }),
      };
    const caughtUp = prompt.answers.filter((a) => a.tag === "caughtUp");
    return {
      summary: t("receipt.models", {
        count: prompt.answers.length,
        credits: cr(credits),
        money: money(credits),
      }),
      detail: caughtUp.length
        ? t("receipt.catchUp", {
            credits: cr(COFFEE_CHAT.catchUpCredits),
            names: list(caughtUp.map((a) => info(a.model).short)),
          })
        : cheap && prompt.answers.length > 1
          ? t("receipt.cheapest", {
              name: info(cheap.model).short,
              credits: cr(cheap.credits ?? 0),
            })
          : undefined,
    };
  })();

  // ---- Earlier prompt, folded.
  const [showPrevious, setShowPrevious] = useState(false);
  const summary = previous && !thinking && (
    <PromptSummary
      label={t("summary.label", { n: n(previous.n) })}
      prompt={previous.prompt.text}
      results={ordered(previous.prompt, TAB_ORDER).map((a) => ({
        model: a.model,
        label: a.text
          ? t("summary.result", {
              name: info(a.model).short,
              credits: cr(a.credits ?? 0),
            })
          : t("summary.refunded", { name: info(a.model).short }),
        refunded: !a.text,
      }))}
      toggleLabel={showPrevious ? t("summary.hide") : t("summary.show")}
      expanded={showPrevious}
      onToggle={() => setShowPrevious((v) => !v)}
    />
  );

  const cardHeight = who
    ? "h-chat-card-short"
    : data.n > 1
      ? "h-chat-card"
      : "h-chat-card-tall";
  const grid =
    "flex snap-x gap-4 overflow-x-auto pb-1 xl:grid xl:grid-cols-3 xl:overflow-visible";

  // ======================================================================== Desktop
  const desktop = (
    <div
      className={cx(
        "flex flex-col max-md:hidden",
        data.n > 1 ? "gap-3" : "gap-4",
      )}
    >
      {summary}
      {showPrevious && previous && (
        <>
          <PromptBubble className="self-end">
            {previous.prompt.text}
          </PromptBubble>
          <div className={grid}>
            {ordered(previous.prompt, CARD_ORDER).map((a) => (
              <AnswerCard key={a.model} {...cardProps(a, "h-chat-card")} />
            ))}
          </div>
        </>
      )}
      <PromptBubble className="self-end">{prompt.text}</PromptBubble>
      {step === "thinking-best" && (
        <ThinkingPanel
          className="mx-auto mt-4 max-w-chat-column"
          title={thinkingTitle}
          body={t("thinking.body")}
          rows={rows(false)}
          stopLabel={t("thinking.stop")}
          stopNote={t("thinking.stopNote")}
          onStop={stop}
        />
      )}
      {step === "best" && data.best && (
        <BestAnswerCard
          className="mx-auto mt-4 max-w-chat-column"
          models={ordered(prompt, CARD_ORDER).map((a) => a.model)}
          title={t("best.title")}
          builtFrom={t("best.builtFrom", {
            names: list(
              ordered(prompt, CARD_ORDER).map((a) =>
                modelShortGeneric(a.model),
              ),
            ),
          })}
          intro={data.best.intro}
          points={data.best.ideas.map((idea) => ({
            lead: t("best.lead", { name: idea.name }),
            text: idea.text,
            source: t("best.source", { name: modelShortGeneric(idea.model) }),
          }))}
          metrics={[
            t("metric.seconds", { value: secs(data.best.seconds) }),
            t("metric.tokens", { value: n(data.best.tokens) }),
            tc("creditsShort", { amount: cr(data.best.credits) }),
            tc("money", { amount: money(data.best.credits) }),
          ]}
          seeAllLabel={t("best.seeAll", { count: n(prompt.answers.length) })}
          whyLabel={t("best.why")}
          onSeeAll={() => go("compare")}
        />
      )}
      {thinking && step !== "thinking-best" && (
        <>
          <ThinkingStatusBar
            className="self-start"
            title={thinkingTitle}
            message={statusMessage}
            stopLabel={t("thinking.stop")}
            onStop={stop}
          />
          <div className={grid}>
            {ordered(prompt, CARD_ORDER)
              .filter((a) => rowsData.some((r) => r.model === a.model))
              .map((a) => {
                const row = rowsData.find((r) => r.model === a.model)!;
                return row.status === "done" ? (
                  <AnswerCard
                    key={a.model}
                    {...cardProps(a, "h-chat-card-tall")}
                  />
                ) : (
                  <WritingCard
                    key={a.model}
                    model={a.model}
                    modelName={info(a.model).name}
                    provider={info(a.model).provider}
                    status={rowLabel(row.status)}
                    sizeClassName="h-chat-card-tall w-answer-card-width shrink-0 snap-start xl:w-auto"
                  />
                );
              })}
          </div>
        </>
      )}
      {!thinking && mode === "compare" && (
        <>
          {suggestion && <div className="flex">{suggestion}</div>}
          <div className={grid}>
            {ordered(prompt, CARD_ORDER).map((a) => (
              <AnswerCard key={a.model} {...cardProps(a, cardHeight)} />
            ))}
          </div>
          <PromptReceipt summary={receipt.summary} detail={receipt.detail} />
        </>
      )}
    </div>
  );

  // ======================================================================== Mobile
  const [tab, setTab] = useState<AnswerModel>(() => {
    const preferred = params.tab ?? defaultTab(step);
    return prompt.answers.some((a) => a.model === preferred)
      ? preferred
      : (ordered(prompt, TAB_ORDER)[0]?.model ?? "claude");
  });
  const tabs = ordered(prompt, TAB_ORDER);
  const tabIndex = Math.max(
    0,
    tabs.findIndex((a) => a.model === tab),
  );
  const current = tabs[tabIndex];
  const touch = useRef<number | null>(null);
  const swipe = (dir: number) =>
    setTab(tabs[(tabIndex + dir + tabs.length) % tabs.length].model);

  const tabCaption = (a: DemoAnswer): Pick<ModelTab, "caption" | "tone"> => {
    if (!a.text) return { caption: t("mobile.tab.failed"), tone: "error" };
    if (data.n === 1) {
      if (a.tag === "suggested")
        return { caption: t("mobile.tab.suggested"), tone: "info" };
      if (a.tag === "fastestCheapest")
        return { caption: t("mobile.tab.cheapest"), tone: "success" };
      return { caption: t("mobile.tab.cost", { credits: cr(a.credits ?? 0) }) };
    }
    if (a.tag === "retried") return { caption: t("mobile.tab.answeredNow") };
    if (a.tag === "caughtUp") return { caption: t("mobile.tab.caughtUp") };
    return { caption: t("mobile.tab.answered") };
  };

  const mobileNote = (a: DemoAnswer) => {
    switch (a.tag) {
      case "suggested":
        return {
          tone: "info" as const,
          text:
            data.n === 3
              ? t("mobile.note.suggestedTaglines")
              : t("mobile.note.suggested"),
        };
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
      default:
        return undefined;
    }
  };

  const mobileCard = (a: DemoAnswer): MobileAnswerCardProps => {
    const m = info(a.model);
    if (!a.text) {
      const timeout = a.failure !== "unavailable";
      const askDifferent = {
        label: t("mobile.failed.askDifferent"),
        onClick: composer.openPicker,
      };
      return {
        state: "failed",
        id: `answer-${a.model}`,
        model: a.model,
        title: t(
          timeout
            ? "mobile.failed.timeoutTitle"
            : "mobile.failed.unavailableTitle",
          {
            name: m.short,
          },
        ),
        body: t(
          timeout
            ? "mobile.failed.timeoutBody"
            : "mobile.failed.unavailableBody",
          {
            provider: m.provider,
          },
        ),
        refund: t("mobile.failed.notCharged"),
        actions: timeout
          ? [
              {
                label: t("mobile.failed.tryAgain", {
                  credits: cr(a.retryCredits ?? 0),
                }),
                icon: "reload",
                tone: "tinted",
                onClick: () => retryAnswer(a),
              },
              { ...askDifferent, tone: "secondary" },
            ]
          : [
              { ...askDifferent, tone: "tinted" },
              {
                label: t("mobile.failed.tryLater"),
                icon: "reload",
                tone: "secondary",
                onClick: () => setTab(answered[0]?.model ?? tab),
              },
            ],
      };
    }
    return {
      id: `answer-${a.model}`,
      model: a.model,
      modelName: m.name,
      meta: t("mobile.meta", {
        seconds: secs(a.seconds ?? 0),
        credits: cr(a.credits ?? 0),
        money: money(a.credits ?? 0),
      }),
      note: mobileNote(a),
      suggested: a.tag === "suggested" || a.tag === "only",
      children: a.text,
      labels: {
        copy: t("card.copy"),
        helpful: t("card.helpful"),
        notHelpful: t("card.notHelpful"),
        use: t("mobile.use"),
      },
      onCopy: () => copy(a.text),
      onUse: () => go("best"),
    };
  };

  const hint = (() => {
    if (!missed.length)
      return data.n === 1
        ? t("mobile.hint.swipe")
        : t("mobile.hint.all", { total: n(tabs.length) });
    const counts = { answered: n(answered.length), total: n(tabs.length) };
    return current && !current.text && answered[0]
      ? t("mobile.hint.partialTo", {
          ...counts,
          name: info(answered[0].model).short,
        })
      : t("mobile.hint.partial", counts);
  })();

  const mobileView = (
    <div className="flex flex-col md:hidden">
      {(thinking || step === "best") && <MobilePrompt prompt={prompt.text} />}
      {thinking && (
        <ThinkingPanel
          layout="mobile"
          className="mt-5"
          title={thinkingTitle}
          body={mobileBody}
          rows={rows(true)}
        />
      )}
      {step === "best" && data.best && (
        <MobileBestAnswer
          className="mt-5"
          models={ordered(prompt, CARD_ORDER).map((a) => a.model)}
          title={t("best.title")}
          subtitle={t("best.fromCount", { count: n(prompt.answers.length) })}
          intro={data.best.intro}
          ideas={data.best.ideas.map((idea) => ({
            name: idea.name,
            source: t("best.sourceMobile", { name: info(idea.model).short }),
            text: idea.text,
          }))}
          cost={t("best.cost", { credits: cr(data.best.credits) })}
          money={t("best.money", { amount: money(data.best.credits) })}
          labels={{
            copy: t("card.copy"),
            share: tc("share"),
            helpful: t("card.helpful"),
            notHelpful: t("card.notHelpful"),
            seeAll: t("best.seeAllMobile", { count: n(prompt.answers.length) }),
          }}
          onCopy={() =>
            copy(
              [
                data.best!.intro,
                ...data.best!.ideas.map((i) => `${i.name}: ${i.text}`),
              ].join("\n"),
            )
          }
          onSeeAll={() => go("compare")}
        />
      )}
      {!thinking && mode === "compare" && current && (
        <>
          <MobilePrompt
            variant="line"
            label={t("mobile.youAsked")}
            prompt={prompt.text}
          />
          <ModelTabs
            className="mt-3"
            label={t("mobile.tabs")}
            value={tab}
            onValueChange={(v) => setTab(v as AnswerModel)}
            tabs={tabs.map((a) => ({
              value: a.model,
              model: a.model,
              name: info(a.model).short,
              panelId: `answer-${a.model}`,
              ...tabCaption(a),
            }))}
          />
          <div
            role="tabpanel"
            aria-label={info(current.model).short}
            className="mt-2"
            onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touch.current === null) return;
              const dx = e.changedTouches[0].clientX - touch.current;
              touch.current = null;
              if (Math.abs(dx) > 48) swipe(dx < 0 ? 1 : -1);
            }}
          >
            <MobileAnswerCard {...mobileCard(current)} />
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
  const backHref = thinking
    ? step === "thinking-2"
      ? href("compare")
      : step === "thinking-3"
        ? href("prompt-2", keep)
        : "/"
    : step === "best"
      ? "/chats"
      : href("best");

  const composerSlot = (
    <>
      {thinking ? (
        <ThinkingStop
          className="md:hidden"
          label={t("thinking.stop")}
          note={t("thinking.stopNote")}
          onStop={stop}
        />
      ) : (
        <div className="md:hidden">{composer.mobileComposer}</div>
      )}
      <div className="max-md:hidden">
        {who && (
          <FollowUpRecipients
            className="mb-2"
            message={t("recipients.message")}
            options={[
              {
                value: "all",
                label: t("recipients.all", { count: n(prompt.answers.length) }),
                note: t("recipients.allNote"),
              },
              ...answered.map((a) => ({
                value: a.model,
                label: t("recipients.only", { name: info(a.model).short }),
              })),
            ]}
            value={recipient}
            onValueChange={(v) => setRecipient(v as typeof recipient)}
            cost={
              recipient === "all"
                ? t("recipients.catchUp", {
                    credits: cr(COFFEE_CHAT.catchUpCredits),
                  })
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

  return (
    <>
      <ChatTopBar
        className="absolute inset-x-0 top-3 z-10 max-md:hidden md:pr-6 md:pl-16 lg:px-0"
        title={chat.title}
        titleMenuLabel={t("titleMenu")}
        shareLabel={tc("share")}
        moreLabel={tc("more")}
      />
      <MobileTopBar
        className="shrink-0 md:hidden"
        title={chat.title}
        back={{ label: t("back"), link: <Link href={backHref} /> }}
        actions={[
          ...(step === "best"
            ? [{ icon: "share-01" as const, label: tc("share") }]
            : []),
          { icon: "more-horizontal" as const, label: tc("more") },
        ]}
      />
      <AppMain className="max-md:pt-1" composer={composerSlot}>
        <div className="w-full px-4 pb-6 md:px-6 lg:px-0">
          {desktop}
          {mobileView}
        </div>
      </AppMain>
      {composer.overlays}
      {coffee && (
        <RecipientsSheet
          open={who && mobile}
          onOpenChange={(open) => !open && go("prompt-2", keep)}
          title={t("recipients.title")}
          description={t("recipients.question", { prompt: DEMO_NEXT_PROMPT })}
          value={recipient}
          onValueChange={(v) => setRecipient(v as typeof recipient)}
          choices={[
            {
              value: "all",
              models: TAB_ORDER,
              title: t("recipients.allAis", {
                count: n(prompt.answers.length),
              }),
              description: t("recipients.allBody"),
              cost: t("recipients.cost", {
                credits: cr(COFFEE_CHAT.followUpAllCredits),
                money: money(COFFEE_CHAT.followUpAllCredits),
              }),
            },
            ...answered.map((a) => ({
              value: a.model,
              models: [a.model],
              title: t("recipients.only", { name: info(a.model).short }),
              description: t("recipients.onlyBody"),
              cost: t("recipients.cost", {
                credits: cr(a.credits ?? 0),
                money: money(a.credits ?? 0),
              }),
            })),
          ]}
          note={t("recipients.note")}
          sendLabel={t("recipients.send")}
          onSend={send}
        />
      )}
    </>
  );
}

/** Figma's Best answer card names models by family ("GPT, Claude and Gemini"). */
function modelShortGeneric(m: AnswerModel) {
  return MODELS[m].name;
}
