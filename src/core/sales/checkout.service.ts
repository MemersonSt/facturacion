import { issueDocumentForSale } from "@/core/sales/document.service";
import { createSale } from "@/core/sales/sale.service";
import { checkoutSchema } from "@/core/sales/schemas";

export async function checkout(rawInput: unknown) {
  const input = checkoutSchema.parse(rawInput);
  const saleContext = await createSale(input);
  const documentResult = await issueDocumentForSale(saleContext);

  return {
    saleId: saleContext.sale.id,
    saleNumber: saleContext.sale.saleNumber.toString(),
    saleStatus: saleContext.sale.status,
    totals: saleContext.totals,
    document: documentResult.document,
    invoice: documentResult.invoice,
  };
}
