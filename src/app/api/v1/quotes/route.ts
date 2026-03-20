import { z } from "zod";

import { fail, ok } from "@/lib/http";
import { createQuote, listQuotes } from "@/services/quotes/quote.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const quotes = await listQuotes(status);
    return ok(quotes);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo listar cotizaciones";
    return fail(message, 500);
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const quote = await createQuote(payload);
    return ok(quote, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("Payload invalido", 400, error.flatten());
    }
    const message = error instanceof Error ? error.message : "No se pudo crear cotizacion";
    return fail(message, 400);
  }
}
