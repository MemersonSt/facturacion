import {
  Prisma,
  SaleDocumentStatus,
  SaleStatus,
  SriInvoiceStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { createInvoice } from "@/modules/billing/services/sri.client";

export async function logIntegration(params: {
  operation: "CREATE" | "AUTHORIZE" | "RETRY";
  requestPayload: unknown;
  responsePayload?: unknown;
  httpStatus?: number;
  success: boolean;
  errorMessage?: string;
}) {
  await prisma.integrationLog.create({
    data: {
      service: "SRI_INVOICE",
      operation: params.operation,
      requestPayload: params.requestPayload as Prisma.InputJsonValue,
      responsePayload: params.responsePayload
        ? (params.responsePayload as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      httpStatus: params.httpStatus,
      success: params.success,
      errorMessage: params.errorMessage,
    },
  });
}

function toLocalSriInvoiceStatus(remoteStatus: string | null | undefined) {
  if (remoteStatus === "AUTHORIZED") {
    return SriInvoiceStatus.AUTHORIZED;
  }

  if (remoteStatus === "ERROR") {
    return SriInvoiceStatus.ERROR;
  }

  if (remoteStatus === "DRAFT") {
    return SriInvoiceStatus.DRAFT;
  }

  return SriInvoiceStatus.PENDING_SRI;
}

function toLocalSaleDocumentStatus(invoiceStatus: SriInvoiceStatus) {
  if (invoiceStatus === SriInvoiceStatus.AUTHORIZED) {
    return SaleDocumentStatus.ISSUED;
  }

  if (invoiceStatus === SriInvoiceStatus.ERROR) {
    return SaleDocumentStatus.ERROR;
  }

  return SaleDocumentStatus.PENDING;
}

async function syncSaleDocumentStatusBySriInvoiceId(
  sriInvoiceId: string,
  invoiceStatus: SriInvoiceStatus,
  authorizedAt: Date | null,
) {
  await prisma.saleDocument.updateMany({
    where: { sriInvoiceId },
    data: {
      status: toLocalSaleDocumentStatus(invoiceStatus),
      issuedAt: invoiceStatus === SriInvoiceStatus.AUTHORIZED ? authorizedAt : null,
    },
  });
}

export async function pushAndAuthorizeInvoice(sriInvoiceId: string, payload: unknown) {
  try {
    const issued = await createInvoice(payload);
    const localStatus = toLocalSriInvoiceStatus(issued.status);
    const authorizedAt = issued.authorizedAt ? new Date(issued.authorizedAt) : null;

    await logIntegration({
      operation: "CREATE",
      requestPayload: payload,
      responsePayload: issued,
      success: localStatus !== SriInvoiceStatus.ERROR,
      httpStatus: 200,
    });

    await prisma.sriInvoice.update({
      where: { id: sriInvoiceId },
      data: {
        externalInvoiceId: issued.id ?? undefined,
        secuencial: issued.secuencial ?? undefined,
        status: localStatus,
        claveAcceso: issued.claveAcceso ?? undefined,
        sriReceptionStatus: issued.sriReceptionStatus ?? undefined,
        sriAuthorizationStatus: issued.sriAuthorizationStatus ?? undefined,
        authorizationNumber: issued.authorizationNumber ?? undefined,
        authorizedAt,
        createResponsePayload: issued as Prisma.InputJsonValue,
        lastError: issued.lastError ?? undefined,
      },
    });

    await syncSaleDocumentStatusBySriInvoiceId(
      sriInvoiceId,
      localStatus,
      authorizedAt,
    );

    if (
      issued.artifacts?.signedXmlUrl ||
      issued.artifacts?.authorizedXmlUrl
    ) {
      await prisma.sriInvoiceDocument.upsert({
        where: { sriInvoiceId },
        update: {
          xmlSignedPath: issued.artifacts?.signedXmlUrl ?? undefined,
          xmlAuthorizedPath: issued.artifacts?.authorizedXmlUrl ?? undefined,
          storageProvider: "remote",
        },
        create: {
          sriInvoiceId,
          xmlSignedPath: issued.artifacts?.signedXmlUrl ?? undefined,
          xmlAuthorizedPath: issued.artifacts?.authorizedXmlUrl ?? undefined,
          storageProvider: "remote",
        },
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido en servicio SRI";

    await logIntegration({
      operation: "CREATE",
      requestPayload: payload,
      success: false,
      errorMessage: message,
    });

    await prisma.sriInvoice.update({
      where: { id: sriInvoiceId },
      data: {
        status: SriInvoiceStatus.PENDING_SRI,
        retryCount: { increment: 1 },
        lastError: message,
      },
    });
  }
}

export async function retrySriInvoiceAuthorization(sriInvoiceId: string) {
  const invoice = await prisma.sriInvoice.findUnique({
    where: { id: sriInvoiceId },
    include: {
      sale: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!invoice) {
    throw new Error("Factura local no encontrada");
  }

  if (!invoice.createRequestPayload) {
    throw new Error("La factura no tiene payload guardado para reintento");
  }

  if (invoice.sale.status === SaleStatus.CANCELLED) {
    throw new Error("No se puede reintentar una factura de una venta anulada");
  }

  try {
    const response = await createInvoice(invoice.createRequestPayload);
    const localStatus = toLocalSriInvoiceStatus(response.status);
    const authorizedAt = response.authorizedAt
      ? new Date(response.authorizedAt)
      : null;

    await logIntegration({
      operation: "RETRY",
      requestPayload: invoice.createRequestPayload,
      responsePayload: response,
      success: localStatus !== SriInvoiceStatus.ERROR,
      httpStatus: 200,
    });
    const updatedInvoice = await prisma.sriInvoice.update({
      where: { id: sriInvoiceId },
      data: {
        externalInvoiceId: response.id ?? undefined,
        secuencial: response.secuencial ?? undefined,
        status: localStatus,
        claveAcceso: response.claveAcceso ?? undefined,
        sriReceptionStatus: response.sriReceptionStatus ?? undefined,
        sriAuthorizationStatus: response.sriAuthorizationStatus ?? undefined,
        authorizationNumber: response.authorizationNumber ?? undefined,
        authorizedAt,
        retryCount: { increment: 1 },
        lastError: response.lastError ?? undefined,
        authorizeResponsePayload: response as Prisma.InputJsonValue,
      },
      include: {
        documents: true,
      },
    });

    await syncSaleDocumentStatusBySriInvoiceId(
      sriInvoiceId,
      localStatus,
      authorizedAt,
    );

    if (
      response.artifacts?.signedXmlUrl ||
      response.artifacts?.authorizedXmlUrl
    ) {
      await prisma.sriInvoiceDocument.upsert({
        where: { sriInvoiceId },
        update: {
          xmlSignedPath: response.artifacts?.signedXmlUrl ?? undefined,
          xmlAuthorizedPath: response.artifacts?.authorizedXmlUrl ?? undefined,
          storageProvider: "remote",
        },
        create: {
          sriInvoiceId,
          xmlSignedPath: response.artifacts?.signedXmlUrl ?? undefined,
          xmlAuthorizedPath: response.artifacts?.authorizedXmlUrl ?? undefined,
          storageProvider: "remote",
        },
      });
    }

    return updatedInvoice;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error de reintento";

    await logIntegration({
      operation: "RETRY",
      requestPayload: invoice.createRequestPayload,
      success: false,
      errorMessage: message,
    });

    return prisma.sriInvoice.update({
      where: { id: sriInvoiceId },
      data: {
        status: SriInvoiceStatus.PENDING_SRI,
        retryCount: { increment: 1 },
        lastError: message,
      },
      include: {
        documents: true,
      },
    });
  }
}
