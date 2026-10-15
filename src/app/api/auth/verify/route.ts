import { findOrCreateByPhone, meResponse } from "@/lib/auth/account";
import { checkCode, toE164 } from "@/lib/auth/otp";
import { createSession, destroySession } from "@/lib/auth/session";
import { VerifyCodeRequest } from "@/lib/contracts/auth";
import { getDb } from "@/lib/db";
import { json, readBody, route } from "@/lib/server/api";

// POST /api/auth/verify — check the code, create the account on first sign-in, start a session.
export const POST = route(async (req: Request) => {
  const {
    phone: national,
    code,
    locale,
  } = await readBody(req, VerifyCodeRequest);
  const phone = toE164(national);
  const db = await getDb();

  await checkCode(db, { phone, code });
  const { user, isNew } = await findOrCreateByPhone(db, phone, locale ?? "en");

  // A fresh session token on every sign-in (no session fixation); end any previous one.
  await destroySession();
  await createSession(user.id, req.headers.get("user-agent"));
  return json(await meResponse(db, user, { isNew }));
});
