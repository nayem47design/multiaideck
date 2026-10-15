import { z } from "zod";

import { toE164 } from "@/lib/auth/otp";
import { devLastSms } from "@/lib/auth/sms";
import { BdPhoneSchema } from "@/lib/contracts/auth";
import { ApiError, json, readQuery, route } from "@/lib/server/api";
import { assertDev } from "@/lib/server/dev";

// Development only (404 in production): the last code the console SMS provider "sent" to a number,
// so e2e tests can sign in by phone. Codes are only kept in this process's memory.
export const GET = route(async (req: Request) => {
  assertDev();
  const { phone } = readQuery(req, z.object({ phone: BdPhoneSchema }));
  const code = devLastSms(toE164(phone))?.text.match(/\b(\d{6})\b/)?.[1];
  if (!code)
    throw new ApiError(404, "not_found", "No code sent to this number");
  return json({ code });
});
