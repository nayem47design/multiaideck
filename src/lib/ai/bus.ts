import "server-only";

import type { BestAnswer, StreamEvent } from "@/lib/contracts/chat";

// Progress of running prompts, for the SSE stream (/api/prompts/:id/stream).
//
// IN-PROCESS ONLY. The orchestrator runs a prompt in the server process that received it and
// publishes events here; the stream route subscribes here. That's right for one server (and for
// development). With several instances behind a load balancer, a client can reconnect to another
// instance: replace `InProcessBus` with a shared pub/sub (Redis pub/sub, or Postgres
// LISTEN/NOTIFY) behind the same `PromptBus` interface, and route Stop to the instance that runs
// the prompt (or poll a "stop requested" flag). The database snapshot already works across
// instances; only live deltas and Stop need the shared channel.
//
// State lives on globalThis so it survives dev reloads and is shared by every route bundle.

/** Listeners get each event with a sequence number that only grows (see `seq()`). */
export type Listener = (e: StreamEvent, seq: number) => void;

export interface PromptBus {
  publish(promptId: string, event: StreamEvent): void;
  subscribe(promptId: string, listener: Listener): () => void;
  /** The last sequence number published. */
  seq(): number;
}

class InProcessBus implements PromptBus {
  private listeners = new Map<string, Set<Listener>>();
  private n = 0;
  seq() {
    return this.n;
  }
  publish(promptId: string, event: StreamEvent) {
    const seq = ++this.n;
    for (const l of this.listeners.get(promptId) ?? []) {
      try {
        l(event, seq);
      } catch {
        // A broken listener (closed stream) must not stop the others.
      }
    }
  }
  subscribe(promptId: string, listener: Listener) {
    let set = this.listeners.get(promptId);
    if (!set) this.listeners.set(promptId, (set = new Set()));
    set.add(listener);
    return () => {
      set.delete(listener);
      if (!set.size) this.listeners.delete(promptId);
    };
  }
}

/** What a running answer looks like right now (fresher than the database, which lags ~0.5 s). */
export interface LiveAnswer {
  status:
    "queued" | "catching-up" | "streaming" | "done" | "failed" | "stopped";
  failure: "timeout" | "unavailable" | "error" | "stopped" | null;
  text: string;
  controller: AbortController;
}

export interface LivePrompt {
  answers: Map<string, LiveAnswer>;
  best?: BestAnswer;
  mergeController?: AbortController;
  /** Stop was pressed: unfinished answers stop, the merge step is skipped. */
  stopRequested?: boolean;
  /** Set when the run has finished; the entry is kept briefly for late snapshots. */
  finished?: boolean;
  /** Runs still in progress for this prompt (a first run, retries, swaps). */
  runs: number;
}

interface State {
  bus: PromptBus;
  live: Map<string, LivePrompt>;
}

const g = globalThis as unknown as { __multiaiPromptState?: State };
const state: State = (g.__multiaiPromptState ??= {
  bus: new InProcessBus(),
  live: new Map(),
});

export const bus = (): PromptBus => state.bus;

/** Tests or a multi-instance setup can swap the bus. */
export function setBus(b: PromptBus) {
  state.bus = b;
}

export function livePrompt(promptId: string): LivePrompt | undefined {
  return state.live.get(promptId);
}

export function openLivePrompt(promptId: string): LivePrompt {
  let p = state.live.get(promptId);
  if (!p) state.live.set(promptId, (p = { answers: new Map(), runs: 0 }));
  if (!p.runs) p.stopRequested = false;
  p.finished = false;
  p.runs++;
  return p;
}

/** Keep a finished prompt's live state a minute, so a snapshot read during the finish is right. */
const KEEP_FINISHED_MS = 60_000;

export function closeLivePrompt(promptId: string) {
  const p = state.live.get(promptId);
  if (!p) return;
  p.runs = Math.max(0, p.runs - 1);
  if (p.runs) return;
  p.finished = true;
  setTimeout(() => {
    const now = state.live.get(promptId);
    if (now === p && p.finished) state.live.delete(promptId);
  }, KEEP_FINISHED_MS).unref?.();
}
