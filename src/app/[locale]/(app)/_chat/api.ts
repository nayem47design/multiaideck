"use client";

import { api } from "@/lib/api-client";
import type { ModelId } from "@/lib/ai/models";
import {
  ChatDetailSchema,
  SendPromptResponse,
  type Mode,
} from "@/lib/contracts/chat";

// The chat endpoints, typed by src/lib/contracts/chat.ts.

export function sendPrompt(body: {
  chatId?: string;
  text: string;
  mode: Mode;
  models: ModelId[];
  recipients?: ModelId[];
  attachments?: { name: string; kind: "file" | "image"; size: number }[];
}) {
  const { chatId, ...rest } = body;
  return api(chatId ? `/api/chats/${chatId}/prompts` : "/api/chats", {
    method: "POST",
    body: rest,
    schema: SendPromptResponse,
  });
}

export const getChat = (id: string, signal?: AbortSignal) =>
  api(`/api/chats/${id}`, { schema: ChatDetailSchema, signal });

export const retryAnswer = (answerId: string) =>
  api(`/api/answers/${answerId}/retry`, {
    method: "POST",
    schema: SendPromptResponse,
  });

export const swapAnswer = (answerId: string, model: ModelId) =>
  api(`/api/answers/${answerId}/swap`, {
    method: "POST",
    body: { model },
    schema: SendPromptResponse,
  });

export const stopPrompt = (promptId: string) =>
  api(`/api/prompts/${promptId}/stop`, { method: "POST" });
