import { z } from "zod";

import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { loginSchema, verifyCredentials } from "@/modules/auth/auth.service";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const input = loginSchema.parse(payload);

    const user = await verifyCredentials(input.email, input.password);
    if (!user) {
      return fail("Credenciales incorrectas", 401);
    }

    const token = await signSession({
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role as "ADMIN" | "SELLER",
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions());

    return ok({ name: user.name, email: user.email, role: user.role });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("Datos invalidos", 400, error.flatten());
    }
    const message = error instanceof Error ? error.message : "Error al iniciar sesion";
    return fail(message, 500);
  }
}
