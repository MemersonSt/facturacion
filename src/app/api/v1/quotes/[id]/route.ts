import { fail, ok } from "@/lib/http";
import { getQuoteDetail } from "@/modules/quotes/quote.service";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const quote = await getQuoteDetail(id);
    return ok(quote);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo obtener la cotizacion";
    return fail(message, 400);
  }
}
