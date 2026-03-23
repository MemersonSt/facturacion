import axios from "axios";

const SRI_BASE_URL = process.env.SRI_BASE_URL ?? "http://localhost:3000";
const SRI_TIMEOUT_MS = Number(process.env.SRI_TIMEOUT_MS ?? 15000);
export const SRI_SIGNATURE_ISSUER_ID =
  process.env.SRI_SIGNATURE_ISSUER_ID ??
  "5fc1d44c-9a58-4383-b475-2c3adb49afc9";

const http = axios.create({
  baseURL: SRI_BASE_URL,
  timeout: SRI_TIMEOUT_MS,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export type SriInvoiceArtifacts = {
  signedXmlUrl?: string | null;
  authorizedXmlUrl?: string | null;
  responseReceptionUrl?: string | null;
  responseAuthUrl?: string | null;
};

export type SriInvoiceIssueResponse = {
  id?: string | null;
  issuerId?: string | null;
  establecimiento?: string | null;
  puntoEmision?: string | null;
  fechaEmision?: string | null;
  clienteTipoIdentificacion?: string | null;
  clienteIdentificacion?: string | null;
  clienteRazonSocial?: string | null;
  clienteDireccion?: string | null;
  clienteEmail?: string | null;
  clienteTelefono?: string | null;
  totalSinImpuestos?: number | null;
  totalDescuento?: number | null;
  propina?: number | null;
  importeTotal?: number | null;
  moneda?: string | null;
  secuencial: string | null;
  claveAcceso: string | null;
  status: string;
  sriReceptionStatus: string | null;
  sriAuthorizationStatus: string | null;
  authorizationNumber: string | null;
  authorizedAt: string | null;
  retryCount: number;
  lastError: string | null;
  detalles?: unknown[];
  pagos?: unknown[];
  infoAdicional?: Record<string, unknown> | null;
  artifacts?: SriInvoiceArtifacts | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export async function createInvoice(payload: unknown) {
  const { data } = await http.post<SriInvoiceIssueResponse>("/api/v1/invoices/issue", payload);
  return data;
}
