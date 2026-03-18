import { fail } from "@/lib/http";
import { buildQuotePrintHtml } from "@/lib/quote-print-template";
import { getQuoteDetail } from "@/modules/quotes/quote.service";
import type { QuoteDetailItem } from "@/components/mvp-dashboard-types";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";

export const runtime = "nodejs";
const PDF_RENDER_TIMEOUT_MS = 15000;

function resolveChromeExecutablePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const candidates = ["/usr/bin/chromium-browser", "/usr/bin/chromium"];
  return candidates.find((candidate) => existsSync(candidate));
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const quote = await getQuoteDetail(id);

    if (quote.status !== "OPEN") {
      return fail("Solo se puede descargar PDF de cotizaciones abiertas", 400);
    }

    let logoBase64 = "";
    try {
      const logoPath = path.join(process.cwd(), "public", "logo.png");
      if (existsSync(logoPath)) {
        const logoBuffer = readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
      }
    } catch (e) {
      console.error("No se pudo cargar el logo para el PDF", e);
    }

    const html = buildQuotePrintHtml({
      quoteNumber: quote.quoteNumber,
      fechaEmision: quote.fechaEmision,
      status: quote.status,
      moneda: quote.moneda,
      formaPago: quote.formaPago,
      customerName: quote.customer.razonSocial,
      customerIdentification: quote.customer.identificacion,
      customerAddress: quote.customer.direccion,
      items: quote.items.map((item: QuoteDetailItem) => ({
        productCode: item.productCode,
        productName: item.productName,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        descuento: item.descuento,
        valorIva: item.valorIva,
        total: item.total,
      })),
      subtotal: quote.subtotal,
      taxTotal: quote.taxTotal,
      total: quote.total,
      companyRazonSocial: "ANDRADE VELASQUEZ MARIA SOL",
      companyNombreComercial: "ANDRADE VELASQUEZ MARIA SOL",
      companyRuc: "956540116001",
      companyDirMatriz: "Pancho Jacome Solar 4A Mz 252",
      companyObligadoContabilidad: "NO",
      estab: process.env.COMPANY_ESTAB ?? "001",
      ptoEmi: process.env.COMPANY_PTO_EMI ?? "001",
      ambiente: process.env.SRI_AMBIENTE ?? "1",
      tipoEmision: process.env.SRI_TIPO_EMISION ?? "1",
      logoBase64,
    });

    const executablePath = resolveChromeExecutablePath();
    console.info("Iniciando generacion PDF de cotizacion", {
      quoteId: id,
      executablePath: executablePath ?? "puppeteer-default",
      platform: process.platform,
      arch: process.arch,
    });

    const browser = await puppeteer.launch({
      headless: true,
      executablePath,
      protocolTimeout: 30000,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
        "--disable-software-rasterizer",
        "--font-render-hinting=none",
      ],
    });

    let pdfBuffer: Uint8Array;
    try {
      browser.on("disconnected", () => {
        console.error("Chromium se desconecto durante la generacion del PDF", {
          quoteId: id,
        });
      });

      const page = await browser.newPage();
      await page.setJavaScriptEnabled(false);
      await page.setContent(html, {
        waitUntil: ["domcontentloaded", "load"],
        timeout: PDF_RENDER_TIMEOUT_MS,
      });
      await page.emulateMediaType("screen");
      await page.waitForSelector("body", { timeout: 5000 });
      const result = await page.pdf({
        format: "A4",
        printBackground: true,
        displayHeaderFooter: false,
        margin: {
          top: "8mm",
          right: "8mm",
          bottom: "8mm",
          left: "8mm",
        },
      });
      pdfBuffer = new Uint8Array(result);
    } finally {
      await browser.close();
    }

    return new Response(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=\"cotizacion-${quote.quoteNumber}.pdf\"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error crítico generando PDF:", error);
    const message = error instanceof Error ? error.message : "No se pudo generar PDF de la cotizacion";
    return fail(`Error de generación: ${message}`, 500);
  }
}
