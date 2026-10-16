import "server-only";

import { ApiError } from "./api";
import { demoMode, env } from "./env";

/** Dev-only routes (migrate, seed, demo sign-in) answer 404 in production. */
export function assertDev() {
  if (env.NODE_ENV === "production") throw new ApiError(404, "not_found");
}

/** Routes a demo deployment also needs (demo sign-in, sandbox checkout); 404 in real production. */
export function assertDevOrDemo() {
  if (env.NODE_ENV === "production" && !demoMode())
    throw new ApiError(404, "not_found");
}
