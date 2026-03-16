import { cookies } from "next/headers";

import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { ok } from "@/lib/http";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  return ok({ message: "Sesion cerrada" });
}
