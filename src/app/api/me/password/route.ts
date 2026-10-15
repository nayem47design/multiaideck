import { and, eq, isNull, ne } from "drizzle-orm";

import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { requireUser } from "@/lib/auth/session";
import { SetPasswordRequest } from "@/lib/contracts/account";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ApiError, readBody, route } from "@/lib/server/api";

// POST /api/me/password — add (or change) email + password as a sign-in method.
export const POST = route(async (req: Request) => {
  const user = await requireUser();
  const {
    email: given,
    password,
    currentPassword,
  } = await readBody(req, SetPasswordRequest);

  if (user.passwordHash) {
    if (
      !currentPassword ||
      !(await verifyPassword(currentPassword, user.passwordHash))
    )
      throw new ApiError(403, "forbidden", "Current password is wrong");
  }

  const email = given ?? user.email;
  if (!email)
    throw new ApiError(400, "invalid_input", "Add an email first", {
      field: "email",
    });

  const db = await getDb();
  if (email !== user.email) {
    const [taken] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.email, email),
          isNull(users.deletedAt),
          ne(users.id, user.id),
        ),
      );
    if (taken) throw new ApiError(409, "conflict", "Email already in use");
  }

  await db
    .update(users)
    .set({
      email,
      emailVerified: email === user.email ? user.emailVerified : false,
      passwordHash: await hashPassword(password),
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));
  return new Response(null, { status: 204 });
});
