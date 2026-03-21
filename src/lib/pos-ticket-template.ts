export type PosTicketLine = {
  quantity: number;
  name: string;
  unitPrice: number;
  total: number;
};

export type PosTicketData = {
  businessName: string;
  operatorName: string;
  saleNumber: string;
  documentNumber: string | null;
  createdAt: string;
  customerName: string;
  paymentMethodLabel: string;
  documentLabel: string;
  subtotal: number;
  taxTotal: number;
  total: number;
  lines: PosTicketLine[];
};

type PosTicketHtmlOptions = {
  autoPrint?: boolean;
  autoClose?: boolean;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatMoney(value: number) {
  return value.toFixed(2);
}

export function buildPosTicketHtml(
  data: PosTicketData,
  options: PosTicketHtmlOptions = {},
) {
  const autoPrint = options.autoPrint ?? true;
  const autoClose = options.autoClose ?? autoPrint;
  const lines = data.lines.map((line) => `
      <tr>
        <td>
          <div class="item-name">${escapeHtml(line.name)}</div>
          <div class="item-meta">${line.quantity.toFixed(2)} x $${formatMoney(line.unitPrice)}</div>
        </td>
        <td class="right">$${formatMoney(line.total)}</td>
      </tr>
    `).join("");

  return `<!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>Ticket ${escapeHtml(data.saleNumber)}</title>
      <style>
        :root {
          color-scheme: light;
        }
        @page {
          size: 78mm auto;
          margin: 0;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, Helvetica, sans-serif;
          background: #fff;
          color: #111827;
        }
        .ticket {
          width: 78mm;
          margin: 0 auto;
          padding: 4px 6px 6px;
        }
        .center { text-align: center; }
        .muted { color: #4b5563; }
        .divider {
          border-top: 1px dashed #9ca3af;
          margin: 6px 0;
        }
        h1 {
          margin: 0 0 3px;
          font-size: 17px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        p {
          margin: 2px 0;
          font-size: 13px;
          line-height: 1.3;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        td {
          padding: 2px 0;
          font-size: 13px;
          vertical-align: top;
        }
        .right {
          text-align: right;
          white-space: nowrap;
          padding-left: 8px;
        }
        .item-name {
          font-weight: 600;
        }
        .item-meta {
          color: #6b7280;
          font-size: 12px;
        }
        .summary td {
          padding: 2px 0;
        }
        .summary tr:last-child td {
          font-weight: 700;
          font-size: 15px;
          padding-top: 3px;
        }
        .print-actions {
          display: flex;
          justify-content: center;
          margin-bottom: 12px;
        }
        .print-actions button {
          border: 1px solid #d1d5db;
          background: #ffffff;
          color: #111827;
          border-radius: 999px;
          padding: 8px 14px;
          font: inherit;
          cursor: pointer;
        }
        @media print {
          html, body { margin: 0; padding: 0; }
          .print-actions { display: none; }
        }
      </style>
    </head>
    <body${
      autoPrint
        ? ` onload="window.print();${autoClose ? " window.close();" : ""}"`
        : ""
    }>
      <main class="ticket">
        ${
          autoPrint
            ? ""
            : `<div class="print-actions"><button onclick="window.print()">Imprimir ticket</button></div>`
        }
        <div class="center">
          <h1>${escapeHtml(data.businessName)}</h1>
          <p class="muted">${escapeHtml(data.documentLabel)}</p>
          ${
            data.documentNumber
              ? `<p><strong>Documento:</strong> ${escapeHtml(data.documentNumber)}</p>`
              : ""
          }
          <p>Venta #${escapeHtml(data.saleNumber)}</p>
        </div>
        <div class="divider"></div>
        <p><strong>Fecha:</strong> ${escapeHtml(data.createdAt)}</p>
        <p><strong>Operador:</strong> ${escapeHtml(data.operatorName)}</p>
        <p><strong>Cliente:</strong> ${escapeHtml(data.customerName)}</p>
        <p><strong>Pago:</strong> ${escapeHtml(data.paymentMethodLabel)}</p>
        <div class="divider"></div>
        <table>
          <tbody>
            ${lines}
          </tbody>
        </table>
        <div class="divider"></div>
        <table class="summary">
          <tbody>
            <tr><td>Subtotal</td><td class="right">$${formatMoney(data.subtotal)}</td></tr>
            <tr><td>IVA</td><td class="right">$${formatMoney(data.taxTotal)}</td></tr>
            <tr><td>Total</td><td class="right">$${formatMoney(data.total)}</td></tr>
          </tbody>
        </table>
        <div class="divider"></div>
        <p class="center muted">Gracias por su compra</p>
      </main>
    </body>
  </html>`;
}
