import { fail, ok } from "@/lib/http";
import { convertQuoteToSale } from "@/modules/quotes/quote.service";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await convertQuoteToSale(id);
    return ok(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo convertir la cotizacion";
    return fail(message, 400);
  }
}
