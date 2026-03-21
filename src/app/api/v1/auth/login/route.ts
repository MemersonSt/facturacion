import { z } from "zod";

import { BusinessFeatureKey } from "@prisma/client";
import { loginSchema, verifyCredentials } from "@/core/auth/auth.service";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
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
      businessId: user.businessId,
      businessName: user.business.name,
      name: user.name,
      email: user.email,
      role: user.role as "ADMIN" | "SELLER",
      features: user.business.features
        .filter((feature) => feature.enabled)
        .map((feature) => feature.key as BusinessFeatureKey),
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions());

    return ok({
      name: user.name,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
      businessName: user.business.name,
      features: user.business.features.filter((feature) => feature.enabled).map((feature) => feature.key),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("Datos invalidos", 400, error.flatten());
    }
    const message = error instanceof Error ? error.message : "Error al iniciar sesion";
    return fail(message, 500);
  }
}
