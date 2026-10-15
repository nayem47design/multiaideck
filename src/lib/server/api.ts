import "server-only";

import { NextResponse } from "next/server";
import { z, type ZodType } from "zod";

import type { ApiErrorBody, ApiErrorCode } from "@/lib/contracts/common";

// Route handler helpers: parse input with the contract's Zod schema, return typed JSON, and turn
// thrown ApiErrors into { error: { code, message } } with the right status.

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ApiErrorCode,
    message?: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message ?? code);
  }
}

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function errorResponse(e: unknown) {
  if (e instanceof ApiError) {
    const body: ApiErrorBody = {
      error: { code: e.code, message: e.message, details: e.details },
    };
    return NextResponse.json(body, { status: e.status });
  }
  if (e instanceof z.ZodError) {
    const body: ApiErrorBody = {
      error: {
        code: "invalid_input",
        message: "Invalid input",
        details: { issues: z.treeifyError(e) },
      },
    };
    return NextResponse.json(body, { status: 400 });
  }
  console.error(e);
  const body: ApiErrorBody = {
    error: { code: "internal", message: "Something went wrong" },
  };
  return NextResponse.json(body, { status: 500 });
}

/** Read and validate a JSON body. */
export async function readBody<S extends ZodType>(
  req: Request,
  schema: S,
): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError(400, "invalid_input", "Body must be JSON");
  }
  return schema.parse(raw);
}

/** Validate query parameters. */
export function readQuery<S extends ZodType>(
  req: Request,
  schema: S,
): z.infer<S> {
  return schema.parse(Object.fromEntries(new URL(req.url).searchParams));
}

/** Wrap a handler so errors become typed responses. */
export function route<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (e) {
      return errorResponse(e);
    }
  };
}

/** Best-effort client IP, for rate limits. */
export function clientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
