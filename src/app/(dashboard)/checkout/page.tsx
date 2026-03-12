"use client";

import { format } from "date-fns";
import { AlertTriangle, CheckCircle2, Info, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { fetchJson } from "@/components/mvp-dashboard-api";
import { CustomerPickerModal, ProductPickerModal } from "@/components/mvp-dashboard-modals";
import { CheckoutSection } from "@/components/mvp-dashboard-sections";
import {
  IDENTIFICATION_TYPES,
  PAYMENT_METHODS,
  type CheckoutForm,
  type Customer,
  type LineItem,
  type LinePreviewItem,
  type Product,
} from "@/components/mvp-dashboard-types";

type CheckoutResponse = {
  saleNumber: string;
  invoice: {
    sriInvoiceId: string;
    status: "DRAFT" | "AUTHORIZED" | "PENDING_SRI" | "ERROR";
  } | null;
};

function buildInitialCheckoutForm(): CheckoutForm {
  return {
    issuerId: "5fc1d44c-9a58-4383-b475-2c3adb49afc9",
    fechaEmision: format(new Date(), "dd/MM/yyyy"),
    tipoIdentificacion: "04",
    identificacion: "",
    razonSocial: "",
    direccion: "",
    email: "",
    telefono: "",
    formaPago: "01",
  };
}

type MessageTone = "success" | "error" | "info";

type CheckoutMessage = {
  text: string;
  tone: MessageTone;
};

function CheckoutMessagePopover({
  message,
  onClose,
}: {
  message: CheckoutMessage | null;
  onClose: () => void;
}) {
  if (!message) return null;

  const toneStyles: Record<MessageTone, string> = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-red-200 bg-red-50 text-red-800",
    info: "border-indigo-200 bg-indigo-50 text-indigo-800",
  };

  const ToneIcon = message.tone === "success"
    ? CheckCircle2
    : message.tone === "error"
      ? AlertTriangle
      : Info;

  return (
    <div className="fixed right-4 top-4 z-[60] w-full max-w-sm">
      <div className={`rounded-xl border p-3 shadow-lg ${toneStyles[message.tone]}`} role="alert" aria-live="polite">
        <div className="flex items-start gap-2">
          <ToneIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="flex-1 text-sm font-medium">{message.text}</p>
          <button type="button" aria-label="Cerrar mensaje" onClick={onClose} className="rounded p-0.5 hover:bg-black/5">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isCustomerPickerOpen, setIsCustomerPickerOpen] = useState(false);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [customerLoading, setCustomerLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<CheckoutMessage | null>(null);
  const [authorizedSriInvoiceId, setAuthorizedSriInvoiceId] = useState<string | null>(null);

  const [checkout, setCheckout] = useState<CheckoutForm>(buildInitialCheckoutForm);

  const linePreview = useMemo<LinePreviewItem[]>(() => {
    return lineItems
      .map((line) => {
        const product = products.find((item) => item.id === line.productId);
        if (!product) {
          return null;
        }

        const subtotal = line.cantidad * product.precio - line.descuento;
        const iva = (subtotal * product.tarifaIva) / 100;
        return {
          ...line,
          product,
          subtotal,
          iva,
          total: subtotal + iva,
        };
      })
      .filter((line): line is LinePreviewItem => Boolean(line));
  }, [lineItems, products]);

  const checkoutTotal = useMemo(() => linePreview.reduce((acc, line) => acc + line.total, 0), [linePreview]);
  const checkoutSubtotal = useMemo(() => linePreview.reduce((acc, line) => acc + line.subtotal, 0), [linePreview]);
  const checkoutTax = useMemo(() => linePreview.reduce((acc, line) => acc + line.iva, 0), [linePreview]);

  const selectedIdentificationType = useMemo(
    () => IDENTIFICATION_TYPES.find((type) => type.code === checkout.tipoIdentificacion),
    [checkout.tipoIdentificacion],
  );
  const selectedPaymentMethod = useMemo(
    () => PAYMENT_METHODS.find((method) => method.code === checkout.formaPago),
    [checkout.formaPago],
  );
  const canResetCheckout = useMemo(
    () =>
      lineItems.length > 0 ||
      Boolean(authorizedSriInvoiceId) ||
      checkout.tipoIdentificacion !== "04" ||
      checkout.formaPago !== "01" ||
      checkout.identificacion.trim() !== "" ||
      checkout.razonSocial.trim() !== "" ||
      checkout.direccion.trim() !== "" ||
      checkout.email.trim() !== "" ||
      checkout.telefono.trim() !== "",
    [lineItems.length, authorizedSriInvoiceId, checkout],
  );

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) {
      return products;
    }

    return products.filter(
      (product) =>
        product.codigo.toLowerCase().includes(term) ||
        product.nombre.toLowerCase().includes(term) ||
        product.id.toLowerCase().includes(term),
    );
  }, [productSearch, products]);

  async function loadCheckoutData() {
    setLoading(true);

    try {
      const [productsRes, customersRes] = await Promise.all([
        fetchJson<Product[]>("/api/v1/products"),
        fetchJson<Customer[]>("/api/v1/customers"),
      ]);

      setProducts(productsRes);
      setCustomers(customersRes);
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "No se pudo cargar checkout", tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCheckoutData();
  }, []);

  async function loadCustomers(search = "") {
    setCustomerLoading(true);

    try {
      const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
      const result = await fetchJson<Customer[]>(`/api/v1/customers${query}`);
      setCustomers(result);
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "No se pudo cargar clientes", tone: "error" });
    } finally {
      setCustomerLoading(false);
    }
  }

  useEffect(() => {
    if (!message) return;
    const timeoutId = setTimeout(() => setMessage(null), 4500);
    return () => clearTimeout(timeoutId);
  }, [message]);

  useEffect(() => {
    if (!isCustomerPickerOpen) {
      return;
    }

    const timeoutId = setTimeout(() => {
      void loadCustomers(customerSearch);
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [customerSearch, isCustomerPickerOpen]);

  function updateLineByProduct(productId: string, patch: Partial<LineItem>) {
    setLineItems((prev) => prev.map((item) => (item.productId === productId ? { ...item, ...patch } : item)));
  }

  function incrementLineQuantity(productId: string, delta: number) {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) {
          return item;
        }

        const next = Number((item.cantidad + delta).toFixed(3));
        return { ...item, cantidad: next < 0.001 ? 0.001 : next };
      }),
    );
  }

  function removeLine(productId: string) {
    setLineItems((prev) => prev.filter((item) => item.productId !== productId));
  }

  function toggleProductSelection(productId: string) {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  }

  function addSelectedProductsToDetail() {
    if (selectedProductIds.length === 0) {
      setIsProductPickerOpen(false);
      return;
    }

    setLineItems((prev) => {
      const existingIds = new Set(prev.map((item) => item.productId));
      const nextItems = [...prev];

      for (const productId of selectedProductIds) {
        if (!existingIds.has(productId)) {
          nextItems.push({ productId, cantidad: 1, descuento: 0 });
        }
      }

      return nextItems;
    });

    setSelectedProductIds([]);
    setProductSearch("");
    setIsProductPickerOpen(false);
  }

  function selectCustomer(customer: Customer) {
    setCheckout((prev) => ({
      ...prev,
      tipoIdentificacion: customer.tipoIdentificacion,
      identificacion: customer.identificacion,
      razonSocial: customer.razonSocial,
      direccion: customer.direccion ?? "",
      email: customer.email ?? "",
      telefono: customer.telefono ?? "",
    }));
    setIsCustomerPickerOpen(false);
    setCustomerSearch("");
    setMessage({ text: `Cliente seleccionado: ${customer.razonSocial}`, tone: "success" });
  }

  function openCustomerPicker() {
    setCustomerSearch("");
    setIsCustomerPickerOpen(true);
    void loadCustomers("");
  }

  function openProductPicker() {
    setSelectedProductIds([]);
    setProductSearch("");
    setIsProductPickerOpen(true);
  }

  function closeCustomerPicker() {
    setIsCustomerPickerOpen(false);
    setCustomerSearch("");
  }

  function cancelProductPicker() {
    setSelectedProductIds([]);
    setProductSearch("");
    setIsProductPickerOpen(false);
  }

  function onResetCheckout() {
    setCheckout(buildInitialCheckoutForm());
    setLineItems([]);
    setSelectedProductIds([]);
    setCustomerSearch("");
    setProductSearch("");
    setIsCustomerPickerOpen(false);
    setIsProductPickerOpen(false);
    setAuthorizedSriInvoiceId(null);
    setMessage({ text: "Formulario reiniciado correctamente.", tone: "info" });
  }

  function validateIdentification(tipoIdentificacion: string, identificacion: string): string | null {
    const normalized = identificacion.trim();

    if (tipoIdentificacion === "05" && !/^\d{10}$/.test(normalized)) {
      return "La cedula debe tener exactamente 10 digitos numericos.";
    }

    if (tipoIdentificacion === "04" && !/^\d{13}$/.test(normalized)) {
      return "El RUC debe tener exactamente 13 digitos numericos.";
    }

    return null;
  }

  async function onCheckout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);

    const identificationValidationError = validateIdentification(checkout.tipoIdentificacion, checkout.identificacion);
    if (identificationValidationError) {
      setMessage({ text: identificationValidationError, tone: "error" });
      return;
    }

    setSaving(true);
    setAuthorizedSriInvoiceId(null);

    try {
      const result = await fetchJson<CheckoutResponse>("/api/v1/sales/checkout", {
        method: "POST",
        body: JSON.stringify({
          issuerId: checkout.issuerId,
          fechaEmision: checkout.fechaEmision,
          moneda: "USD",
          customer: {
            tipoIdentificacion: checkout.tipoIdentificacion,
            identificacion: checkout.identificacion.trim(),
            razonSocial: checkout.razonSocial,
            direccion: checkout.direccion,
            email: checkout.email,
            telefono: checkout.telefono,
          },
          items: linePreview.map((line) => ({
            productId: line.productId,
            cantidad: line.cantidad,
            descuento: line.descuento,
            precioUnitario: line.product.precio,
            tarifaIva: line.product.tarifaIva,
          })),
          payments: [
            {
              formaPago: checkout.formaPago,
              total: Number(checkoutTotal.toFixed(2)),
              plazo: 0,
              unidadTiempo: "DIAS",
            },
          ],
          infoAdicional: {},
        }),
      });

      if (result.invoice?.status === "AUTHORIZED") {
        setAuthorizedSriInvoiceId(result.invoice.sriInvoiceId);
        setMessage({ text: `Venta #${result.saleNumber} registrada y factura autorizada correctamente`, tone: "success" });
      } else {
        setMessage({ text: `Venta #${result.saleNumber} registrada. La factura aun no se encuentra autorizada.`, tone: "info" });
      }

      setLineItems([]);
      setSelectedProductIds([]);
      setProductSearch("");
      await loadCheckoutData();
    } catch (error) {
      setAuthorizedSriInvoiceId(null);
      setMessage({ text: error instanceof Error ? error.message : "No se pudo registrar la venta", tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando checkout...
      </div>
    );
  }

  return (
    <>
      {saving ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[1px]">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-xl">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
            Registrando venta y procesando factura...
          </div>
        </div>
      ) : null}
      <CheckoutMessagePopover message={message} onClose={() => setMessage(null)} />
      <CheckoutSection
        checkout={checkout}
        setCheckout={setCheckout}
        linePreview={linePreview}
        checkoutSubtotal={checkoutSubtotal}
        checkoutTax={checkoutTax}
        checkoutTotal={checkoutTotal}
        selectedIdentificationType={selectedIdentificationType}
        selectedPaymentMethod={selectedPaymentMethod}
        canPrintDocuments={Boolean(authorizedSriInvoiceId)}
        canResetCheckout={canResetCheckout}
        saving={saving}
        onPrintRide={() => {
          if (!authorizedSriInvoiceId) return;
          window.open(`/api/v1/sri-invoices/${authorizedSriInvoiceId}/ride`, "_blank", "noopener,noreferrer");
        }}
        onPrintXml={() => {
          if (!authorizedSriInvoiceId) return;
          window.open(`/api/v1/sri-invoices/${authorizedSriInvoiceId}/xml`, "_blank", "noopener,noreferrer");
        }}
        onResetCheckout={onResetCheckout}
        onCheckout={onCheckout}
        onOpenCustomerPicker={openCustomerPicker}
        onOpenProductPicker={openProductPicker}
        incrementLineQuantity={incrementLineQuantity}
        updateLineByProduct={updateLineByProduct}
        removeLine={removeLine}
      />

      <CustomerPickerModal
        isOpen={isCustomerPickerOpen}
        customerSearch={customerSearch}
        setCustomerSearch={setCustomerSearch}
        customerLoading={customerLoading}
        customers={customers}
        onSelectCustomer={selectCustomer}
        onClose={closeCustomerPicker}
      />

      <ProductPickerModal
        isOpen={isProductPickerOpen}
        productSearch={productSearch}
        setProductSearch={setProductSearch}
        filteredProducts={filteredProducts}
        selectedProductIds={selectedProductIds}
        toggleProductSelection={toggleProductSelection}
        onCancel={cancelProductPicker}
        onConfirm={addSelectedProductsToDetail}
      />
    </>
  );
}
