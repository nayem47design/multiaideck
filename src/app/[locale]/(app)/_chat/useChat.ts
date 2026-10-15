"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiClientError } from "@/lib/api-client";
import type { ModelId } from "@/lib/ai/models";
import { invalidateChats } from "@/lib/chats";
import type {
  Answer,
  ChatDetail,
  Mode,
  Prompt,
  StreamEvent,
} from "@/lib/contracts/chat";
import { me } from "@/lib/me";

import * as chatApi from "./api";

// A chat from GET /api/chats/:id, kept live with each running prompt's event stream
// (/api/prompts/:id/stream). The stream starts with a snapshot, so reconnecting (EventSource does
// it by itself) never loses text; `done` carries the new balance. Leaving the page doesn't stop
// anything: the answers wait in the chat.

export type ChatLoad = "loading" | "ready" | "not-found" | "error";

const RUNNING = new Set(["queued", "catching-up", "streaming"]);
export const isRunning = (p: Prompt) =>
  p.status === "running" ||
  p.answers.some((a) => RUNNING.has(a.status)) ||
  p.best?.status === "streaming";

function applyEvent(prompt: Prompt, e: StreamEvent): Prompt {
  const patchAnswer = (id: string, f: (a: Answer) => Answer) => ({
    ...prompt,
    answers: prompt.answers.map((a) => (a.id === id ? f(a) : a)),
  });
  switch (e.type) {
    case "snapshot":
      return e.prompt;
    case "answer-status":
      return patchAnswer(e.answerId, (a) => ({
        ...a,
        status: e.status,
        failure: e.failure ?? a.failure,
      }));
    case "answer-delta":
      return patchAnswer(e.answerId, (a) => ({
        ...a,
        status: "streaming",
        text: a.text + e.delta,
      }));
    case "answer-done":
      return prompt.answers.some((a) => a.id === e.answer.id)
        ? patchAnswer(e.answer.id, () => e.answer)
        : { ...prompt, answers: [...prompt.answers, e.answer] };
    case "best-delta":
    case "best-done":
      return { ...prompt, best: e.best };
    case "done":
      return prompt;
  }
}

export function useChat(id: string) {
  const [chat, setChat] = useState<ChatDetail | null>(null);
  const [load, setLoad] = useState<ChatLoad>("loading");
  const sources = useRef(new Map<string, EventSource>());
  // For the reconnect timer: the latest `watch` (it refers to itself).
  const rewatch = useRef<(promptId: string) => void>(() => {});

  const reload = useCallback(async () => {
    try {
      const detail = await chatApi.getChat(id);
      setChat(detail);
      setLoad("ready");
      return detail;
    } catch (e) {
      setLoad(
        e instanceof ApiClientError && e.status === 404 ? "not-found" : "error",
      );
      return null;
    }
  }, [id]);

  const watch = useCallback(
    (promptId: string) => {
      if (sources.current.has(promptId)) return;
      const es = new EventSource(`/api/prompts/${promptId}/stream`);
      sources.current.set(promptId, es);
      es.onmessage = (m) => {
        let e: StreamEvent;
        try {
          e = JSON.parse(m.data) as StreamEvent;
        } catch {
          return;
        }
        if (e.type === "done") {
          es.close();
          sources.current.delete(promptId);
          me.setBalance(e.balance);
          invalidateChats();
          void reload(); // credits and the prompt's final status
          return;
        }
        setChat((c) =>
          c
            ? {
                ...c,
                promptsList: c.promptsList.map((p) =>
                  p.id === promptId ? applyEvent(p, e) : p,
                ),
              }
            : c,
        );
      };
      es.onerror = () => {
        // EventSource reconnects by itself (and gets a fresh snapshot); if it gave up, re-read.
        if (es.readyState === EventSource.CLOSED) {
          sources.current.delete(promptId);
          setTimeout(() => {
            void reload().then((d) => {
              const p = d?.promptsList.find((x) => x.id === promptId);
              if (p && isRunning(p)) rewatch.current(promptId);
            });
          }, 2000);
        }
      };
    },
    [reload],
  );

  useEffect(() => {
    rewatch.current = watch;
  }, [watch]);

  useEffect(() => {
    const all = sources.current;
    let live = true;
    chatApi
      .getChat(id)
      .then((detail) => {
        if (!live) return;
        setChat(detail);
        setLoad("ready");
        detail.promptsList.filter(isRunning).forEach((p) => watch(p.id));
      })
      .catch((e: unknown) => {
        if (live)
          setLoad(
            e instanceof ApiClientError && e.status === 404
              ? "not-found"
              : "error",
          );
      });
    return () => {
      live = false;
      all.forEach((es) => es.close());
      all.clear();
    };
  }, [id, watch]);

  /** After a send, retry or swap: show the new rows and follow the prompt. */
  const follow = useCallback(
    async (promptId: string) => {
      await reload();
      me.refresh(); // the hold shows in the balance at once
      invalidateChats();
      // Re-open even if a stream for this prompt just ended.
      sources.current.get(promptId)?.close();
      sources.current.delete(promptId);
      watch(promptId);
    },
    [reload, watch],
  );

  const send = useCallback(
    async (body: {
      text: string;
      mode: Mode;
      models: ModelId[];
      recipients?: ModelId[];
      attachments?: { name: string; kind: "file" | "image"; size: number }[];
    }) => {
      const sent = await chatApi.sendPrompt({ chatId: id, ...body });
      await follow(sent.promptId);
      return sent;
    },
    [id, follow],
  );

  const retry = useCallback(
    async (answerId: string) => {
      const sent = await chatApi.retryAnswer(answerId);
      await follow(sent.promptId);
    },
    [follow],
  );

  const swap = useCallback(
    async (answerId: string, model: ModelId) => {
      const sent = await chatApi.swapAnswer(answerId, model);
      await follow(sent.promptId);
    },
    [follow],
  );

  const stop = useCallback(async (promptId: string) => {
    await chatApi.stopPrompt(promptId);
  }, []);

  return { chat, load, reload, send, retry, swap, stop };
}
