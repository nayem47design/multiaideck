import type { ZodType, z } from "zod";

import type { ApiErrorBody, ApiErrorCode } from "@/lib/contracts/common";

// Browser-side calls to the API routes, typed by the contracts in src/lib/contracts.

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ApiErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export async function api<S extends ZodType>(
  path: string,
  {
    method = "GET",
    body,
    schema,
    signal,
  }: { method?: string; body?: unknown; schema?: S; signal?: AbortSignal } = {},
): Promise<z.infer<S>> {
  const res = await fetch(path, {
    method,
    signal,
    headers:
      body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "same-origin",
  });
  if (res.status === 204) return undefined as z.infer<S>;
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (data as ApiErrorBody | null)?.error;
    throw new ApiClientError(
      res.status,
      err?.code ?? "internal",
      err?.message ?? res.statusText,
      err?.details,
    );
  }
  return schema ? schema.parse(data) : (data as z.infer<S>);
}
