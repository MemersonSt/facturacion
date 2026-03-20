import { MovementType, Prisma, ReferenceType, SaleStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function cancelSaleBySriInvoiceId(sriInvoiceId: string) {
  await prisma.$transaction(async (tx) => {
    const invoice = await tx.sriInvoice.findUnique({
      where: { id: sriInvoiceId },
      include: {
        sale: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new Error("Factura SRI no encontrada");
    }

    if (invoice.sale.status === SaleStatus.CANCELLED) {
      throw new Error("La venta ya fue anulada");
    }

    const productQuantities = new Map<string, number>();
    for (const item of invoice.sale.items) {
      const current = productQuantities.get(item.productId) ?? 0;
      productQuantities.set(item.productId, current + Number(item.cantidad));
    }

    for (const [productId, quantity] of productQuantities.entries()) {
      const updated = await tx.stockLevel.updateMany({
        where: { productId },
        data: { quantity: { increment: quantity } },
      });

      if (updated.count === 0) {
        throw new Error("No existe registro de stock para uno o mas productos de la venta");
      }
    }

    await tx.stockMovement.createMany({
      data: Array.from(productQuantities.entries()).map(([productId, quantity]) => ({
        productId,
        movementType: MovementType.IN,
        referenceType: ReferenceType.SALE,
        referenceId: invoice.saleId,
        quantity: new Prisma.Decimal(quantity),
        notes: `Ingreso por anulacion de venta #${invoice.sale.saleNumber.toString()}`,
      })),
    });

    await tx.sale.update({
      where: { id: invoice.saleId },
      data: { status: SaleStatus.CANCELLED },
    });

    await tx.sriInvoice.update({
      where: { id: sriInvoiceId },
      data: {
        sriAuthorizationStatus: "CANCELLED_MANUAL",
        lastError: "Factura/venta anulada manualmente",
      },
    });
  });

  return { success: true };
}
