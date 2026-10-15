import { bus } from "@/lib/ai/bus";
import { isLive, promptForUser, promptSnapshot } from "@/lib/ai/orchestrator";
import { requireUser } from "@/lib/auth/session";
import type { StreamEvent } from "@/lib/contracts/chat";
import { getDb } from "@/lib/db";
import { route } from "@/lib/server/api";
import { userBalance } from "@/lib/server/users";

// GET /api/prompts/:id/stream — Server-Sent Events, one StreamEvent JSON per `data:` line.
//
// Always starts with a snapshot of the prompt (from the database, overlaid with the live run), then
// streams answer-status / answer-delta / answer-done / best-* events, and ends with `done` and the
// new balance. Resumable: a client that reconnects (EventSource does it on its own) gets a fresh
// snapshot, so nothing is lost while it was away — the work never depended on the connection.
//
// We subscribe BEFORE reading the snapshot and buffer events; the snapshot carries the bus
// sequence number it reflects, so buffered events already in it are dropped and none are missed.
// If this process isn't running the prompt (another instance, or a restart), the stream ends after
// the snapshot and the client's reconnect picks up the database state (see bus.ts).

const HEARTBEAT_MS = 15_000;
const RECONNECT_MS = 3_000;

export const GET = route(
  async (req: Request, ctx: RouteContext<"/api/prompts/[id]/stream">) => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const db = await getDb();
    await promptForUser(db, user.id, id); // 404 before opening the stream

    const encoder = new TextEncoder();
    let cleanup = () => {};
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let closed = false;
        let ready = false;
        let snapSeq = 0;
        const buffered: [StreamEvent, number][] = [];
        const write = (chunk: string) => {
          if (closed) return;
          try {
            controller.enqueue(encoder.encode(chunk));
          } catch {
            close();
          }
        };
        const send = (e: StreamEvent) => {
          write(`data: ${JSON.stringify(e)}\n\n`);
          if (e.type === "done") close();
        };
        const unsubscribe = bus().subscribe(id, (e, seq) => {
          if (!ready) buffered.push([e, seq]);
          else if (seq > snapSeq) send(e);
        });
        const heartbeat = setInterval(() => write(": ping\n\n"), HEARTBEAT_MS);
        function close() {
          if (closed) return;
          closed = true;
          unsubscribe();
          clearInterval(heartbeat);
          try {
            controller.close();
          } catch {
            // already closed
          }
        }
        cleanup = close;
        req.signal.addEventListener("abort", close);

        try {
          write(`retry: ${RECONNECT_MS}\n\n`);
          const { prompt, seq } = await promptSnapshot(db, user.id, id);
          snapSeq = seq;
          send({ type: "snapshot", prompt });
          ready = true;
          for (const [e, s] of buffered) if (s > seq) send(e);
          if (closed) return;
          if (!isLive(id)) {
            if (prompt.status !== "running") {
              const balance = await userBalance(db, user.id);
              send({ type: "done", balance: balance.credits });
            } else close(); // not running here: the client reconnects for a fresh snapshot
          }
        } catch (e) {
          console.error("[stream]", id, e);
          close();
        }
      },
      cancel() {
        cleanup();
      },
    });

    return new Response(stream, {
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
        "x-accel-buffering": "no",
      },
    });
  },
);
