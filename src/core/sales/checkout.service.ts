import {
  authorizePendingSaleDocument,
  createDocumentForSaleInTransaction,
  type PendingSaleDocumentAuthorization,
} from "@/core/sales/document.service";
import { createSaleInTransaction } from "@/core/sales/sale.service";
import { checkoutSchema } from "@/core/sales/schemas";
import { createLogger, startTimer, timerDurationMs } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

const logger = createLogger("SalesCheckout");

type CheckoutOptions = {
  inventoryTrackingEnabled?: boolean;
};

export type CheckoutResult = {
  saleId: string;
  saleNumber: string;
  saleStatus: string;
  totals: {
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    total: number;
  };
  document: Awaited<
    ReturnType<typeof createDocumentForSaleInTransaction>
  >["document"];
  invoice: Awaited<
    ReturnType<typeof createDocumentForSaleInTransaction>
  >["invoice"];
  backgroundDocumentTask: PendingSaleDocumentAuthorization | null;
};

export async function checkout(rawInput: unknown, options?: CheckoutOptions) {
  const startedAt = startTimer();

  try {
    const input = checkoutSchema.parse(rawInput);
    const { saleContext, documentResult } = await prisma.$transaction(
      async (tx) => {
        const saleContext = await createSaleInTransaction(tx, input, {
          startedAt,
          inventoryTrackingEnabled: options?.inventoryTrackingEnabled,
        });
        const documentResult = await createDocumentForSaleInTransaction(
          tx,
          saleContext,
        );

        return {
          saleContext,
          documentResult,
        };
      },
    );

    logger.info("checkout:completed", {
      saleId: saleContext.sale.id,
      saleNumber: saleContext.sale.saleNumber.toString(),
      saleStatus: saleContext.sale.status,
      documentType: documentResult.document.type,
      documentStatus: documentResult.document.status,
      backgroundDocument: Boolean(documentResult.backgroundAuthorization),
      inventoryTrackingEnabled: options?.inventoryTrackingEnabled ?? true,
      durationMs: timerDurationMs(startedAt),
    });

    return {
      saleId: saleContext.sale.id,
      saleNumber: saleContext.sale.saleNumber.toString(),
      saleStatus: saleContext.sale.status,
      totals: saleContext.totals,
      document: documentResult.document,
      invoice: documentResult.invoice,
      backgroundDocumentTask: documentResult.backgroundAuthorization,
    } satisfies CheckoutResult;
  } catch (error) {
    logger.error("checkout:failed", {
      durationMs: timerDurationMs(startedAt),
      message: error instanceof Error ? error.message : "Error desconocido",
    });
    throw error;
  }
}

export { authorizePendingSaleDocument };
