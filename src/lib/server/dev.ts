import "server-only";

import { ApiError } from "./api";
import { env } from "./env";

/** Dev-only routes (migrate, seed, demo sign-in) answer 404 in production. */
export function assertDev() {
  if (env.NODE_ENV === "production") throw new ApiError(404, "not_found");
}
