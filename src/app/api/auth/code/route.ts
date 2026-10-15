import { and, eq, isNull } from "drizzle-orm";

import { OTP, issueCode, toE164 } from "@/lib/auth/otp";
import { codeText, smsSender } from "@/lib/auth/sms";
import { SendCodeRequest, type SendCodeResponse } from "@/lib/contracts/auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { clientIp, json, readBody, route } from "@/lib/server/api";

// POST /api/auth/code — text a 6-digit sign-in code (rate limits and lockout: src/lib/auth/otp.ts).
export const POST = route(async (req: Request) => {
  const { phone: national, locale } = await readBody(req, SendCodeRequest);
  const phone = toE164(national);
  const db = await getDb();

  const { code, resendIn, expiresIn } = await issueCode(db, {
    phone,
    ip: clientIp(req),
  });

  // An existing user gets the SMS in their saved language; a new one in the screen's language.
  const [existing] = await db
    .select({ locale: users.locale })
    .from(users)
    .where(and(eq(users.phone, phone), isNull(users.deletedAt)));
  await smsSender().send(
    phone,
    codeText(existing?.locale ?? locale ?? "en", code, OTP.ttlSec / 60),
  );

  return json<SendCodeResponse>({ sentTo: phone, resendIn, expiresIn });
});
