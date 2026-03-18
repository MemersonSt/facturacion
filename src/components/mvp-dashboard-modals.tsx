import MuiButton from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { DataGrid, type GridColDef, type GridRowSelectionModel } from "@mui/x-data-grid";
import { Loader2 } from "lucide-react";
import { useMemo, type Dispatch, type FormEvent, type SetStateAction } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  Customer,
  EditProductForm,
  NewProductForm,
  Product,
  SriInvoiceDetail,
  StockAdjustmentForm,
} from "@/components/mvp-dashboard-types";

const modalDataGridSx = {
  border: 0,
  minHeight: 320,
  backgroundColor: "transparent",
  color: "#4a3c58",
  "--DataGrid-containerBackground": "#fdf7fb",
  "& .MuiDataGrid-columnHeaders": {
    borderBottom: "1px solid rgba(232, 213, 229, 0.65)",
    minHeight: "40px !important",
  },
  "& .MuiDataGrid-columnHeaderTitle": {
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontSize: 12,
  },
  "& .MuiDataGrid-cell": {
    borderColor: "rgba(232, 213, 229, 0.65)",
    fontSize: 13,
  },
  "& .MuiDataGrid-row:hover": {
    backgroundColor: "#fffafc",
  },
  "& .MuiDataGrid-footerContainer": {
    borderTop: "1px solid rgba(232, 213, 229, 0.65)",
  },
  "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": {
    outline: "none",
  },
  "& .MuiTablePagination-root, & .MuiDataGrid-selectedRowCount": {
    color: "#4a3c58",
  },
} as const;

type ProductModalProps = {
  isOpen: boolean;
  newProduct: NewProductForm;
  setNewProduct: Dispatch<SetStateAction<NewProductForm>>;
  saving: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export function ProductModal({ isOpen, newProduct, setNewProduct, saving, onClose, onSubmit }: ProductModalProps) {
  return (
    <Dialog
      open={isOpen}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="md"
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: "rgba(74, 60, 88, 0.30)",
            backdropFilter: "blur(4px)",
          },
        },
      }}
    >
      <DialogTitle>Nuevo Producto</DialogTitle>
      <DialogContent>
        <p className="mb-5 text-sm text-[#4a3c58]/70">
          Completa la informacion base para inventario y ventas.
        </p>
        <form
          id="new-product-form"
          className="grid gap-3"
          onSubmit={onSubmit}
        >
          <div>
            <TextField
              id="modal-nombre"
              label="Nombre"
              value={newProduct.nombre}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, nombre: e.target.value }))}
              required
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <TextField
                id="modal-sku"
                label="SKU (opcional)"
                value={newProduct.sku}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, sku: e.target.value }))}
              />
            </div>
            <div>
              <TextField
                id="modal-precio"
                label="Precio"
                type="number"
                value={newProduct.precio}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, precio: e.target.value }))}
                required
                slotProps={{
                  htmlInput: {
                    min: 0,
                    step: "0.01",
                  },
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <TextField
                id="modal-iva"
                label="IVA %"
                type="number"
                value={newProduct.tarifaIva}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, tarifaIva: e.target.value }))}
                required
                slotProps={{
                  htmlInput: {
                    min: 0,
                    step: "0.01",
                  },
                }}
              />
            </div>
            <div>
              <TextField
                id="modal-stock-inicial"
                label="Stock inicial"
                type="number"
                value={newProduct.stockInicial}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, stockInicial: e.target.value }))}
                required
                slotProps={{
                  htmlInput: {
                    min: 0,
                    step: "0.001",
                  },
                }}
              />
            </div>
            <div>
              <TextField
                id="modal-min-stock"
                label="Stock minimo"
                type="number"
                value={newProduct.minStock}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, minStock: e.target.value }))}
                required
                slotProps={{
                  htmlInput: {
                    min: 0,
                    step: "0.001",
                  },
                }}
              />
            </div>
          </div>
        </form>
      </DialogContent>
      <DialogActions>
        <MuiButton type="button" variant="outlined" onClick={onClose} disabled={saving}>
          Cancelar
        </MuiButton>
        <MuiButton type="submit" form="new-product-form" variant="contained" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
            </>
          ) : (
            "Guardar"
          )}
        </MuiButton>
      </DialogActions>
    </Dialog>
  );
}

type EditProductModalProps = {
  isOpen: boolean;
  editForm: EditProductForm;
  setEditForm: Dispatch<SetStateAction<EditProductForm>>;
  saving: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export function EditProductModal({ isOpen, editForm, setEditForm, saving, onClose, onSubmit }: EditProductModalProps) {
  return (
    <Dialog
      open={isOpen}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="md"
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: "rgba(74, 60, 88, 0.30)",
            backdropFilter: "blur(4px)",
          },
        },
      }}
    >
      <DialogTitle>Editar Producto</DialogTitle>
      <DialogContent>
        <p className="mb-5 text-sm text-[#4a3c58]/70">
          Modifica los datos del producto. El stock se gestiona desde Inventario.
        </p>
        <form id="edit-product-form" className="grid gap-3" onSubmit={onSubmit}>
          <div>
            <TextField
              id="edit-nombre"
              label="Nombre"
              value={editForm.nombre}
              onChange={(e) => setEditForm((prev) => ({ ...prev, nombre: e.target.value }))}
              required
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <TextField
                id="edit-sku"
                label="SKU (opcional)"
                value={editForm.sku}
                onChange={(e) => setEditForm((prev) => ({ ...prev, sku: e.target.value }))}
              />
            </div>
            <div>
              <TextField
                id="edit-precio"
                label="Precio"
                type="number"
                value={editForm.precio}
                onChange={(e) => setEditForm((prev) => ({ ...prev, precio: e.target.value }))}
                required
                slotProps={{
                  htmlInput: {
                    min: 0,
                    step: "0.01",
                  },
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <TextField
                id="edit-iva"
                label="IVA %"
                type="number"
                value={editForm.tarifaIva}
                onChange={(e) => setEditForm((prev) => ({ ...prev, tarifaIva: e.target.value }))}
                required
                slotProps={{
                  htmlInput: {
                    min: 0,
                    step: "0.01",
                  },
                }}
              />
            </div>
            <div>
              <TextField
                id="edit-min-stock"
                label="Stock minimo"
                type="number"
                value={editForm.minStock}
                onChange={(e) => setEditForm((prev) => ({ ...prev, minStock: e.target.value }))}
                required
                slotProps={{
                  htmlInput: {
                    min: 0,
                    step: "0.001",
                  },
                }}
              />
            </div>
          </div>
        </form>
      </DialogContent>
      <DialogActions>
        <MuiButton type="button" variant="outlined" onClick={onClose} disabled={saving}>
          Cancelar
        </MuiButton>
        <MuiButton type="submit" form="edit-product-form" variant="contained" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
            </>
          ) : (
            "Guardar cambios"
          )}
        </MuiButton>
      </DialogActions>
    </Dialog>
  );
}

type DeleteProductModalProps = {
  isOpen: boolean;
  productName: string;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteProductModal({ isOpen, productName, saving, onClose, onConfirm }: DeleteProductModalProps) {
  return (
    <Dialog
      open={isOpen}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: "rgba(74, 60, 88, 0.30)",
            backdropFilter: "blur(4px)",
          },
        },
      }}
    >
      <DialogTitle>Eliminar Producto</DialogTitle>
      <DialogContent>
        <p className="text-sm text-[#4a3c58]/80">
          ¿Estas seguro de que deseas desactivar el producto{" "}
          <span className="font-semibold text-[#4a3c58]">{productName}</span>? El producto no se borrara, quedara inactivo y dejara de aparecer en el catalogo.
        </p>
      </DialogContent>
      <DialogActions>
        <MuiButton type="button" variant="outlined" onClick={onClose} disabled={saving}>
          Cancelar
        </MuiButton>
        <MuiButton
          type="button"
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Eliminando...
            </>
          ) : (
            "Desactivar"
          )}
        </MuiButton>
      </DialogActions>
    </Dialog>
  );
}

type StockAdjustmentModalProps = {
  isOpen: boolean;
  products: Product[];
  adjustment: StockAdjustmentForm;
  setAdjustment: Dispatch<SetStateAction<StockAdjustmentForm>>;
  saving: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export function StockAdjustmentModal({
  isOpen,
  products,
  adjustment,
  setAdjustment,
  saving,
  onClose,
  onSubmit,
}: StockAdjustmentModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#4a3c58]/30 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl border border-[#e8d5e5] bg-[#fdfcf5] shadow-xl">
        <div className="border-b border-[#e8d5e5]/60 p-5">
          <h3 className="text-lg font-semibold text-[#4a3c58]">Ajuste de Stock</h3>
          <p className="mt-1 text-sm text-[#4a3c58]/70">Registra entrada, salida o ajuste puntual de inventario.</p>
        </div>
        <form className="grid gap-3 p-5" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="modal-stock-product">Producto</Label>
            <select
              id="modal-stock-product"
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
              value={adjustment.productId}
              onChange={(e) => setAdjustment((prev) => ({ ...prev, productId: e.target.value }))}
              required
            >
              <option value="">Selecciona producto</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.codigo} - {product.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="modal-stock-movement">Tipo</Label>
              <select
                id="modal-stock-movement"
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                value={adjustment.movementType}
                onChange={(e) =>
                  setAdjustment((prev) => ({ ...prev, movementType: e.target.value as StockAdjustmentForm["movementType"] }))
                }
              >
                <option value="IN">Entrada</option>
                <option value="OUT">Salida</option>
                <option value="ADJUSTMENT">Ajuste</option>
              </select>
            </div>
            <div>
              <Label htmlFor="modal-stock-qty">Cantidad</Label>
              <Input
                id="modal-stock-qty"
                type="number"
                min="0"
                step="0.001"
                value={adjustment.quantity}
                onChange={(e) => setAdjustment((prev) => ({ ...prev, quantity: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...
                </>
              ) : (
                "Guardar Movimiento"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

type CustomerPickerModalProps = {
  isOpen: boolean;
  customerSearch: string;
  setCustomerSearch: Dispatch<SetStateAction<string>>;
  customerLoading: boolean;
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
  onClose: () => void;
};

export function CustomerPickerModal({
  isOpen,
  customerSearch,
  setCustomerSearch,
  customerLoading,
  customers,
  onSelectCustomer,
  onClose,
}: CustomerPickerModalProps) {
  if (!isOpen) {
    return null;
  }

  const customerColumns: GridColDef<Customer>[] = [
    {
      field: "tipoIdentificacion",
      headerName: "Tipo",
      minWidth: 90,
      flex: 0.5,
    },
    {
      field: "identificacion",
      headerName: "Identificacion",
      minWidth: 150,
      flex: 0.85,
      renderCell: (params) => (
        <span className="font-semibold text-[#4a3c58]">{params.row.identificacion}</span>
      ),
    },
    {
      field: "razonSocial",
      headerName: "Razon social",
      minWidth: 220,
      flex: 1.25,
    },
    {
      field: "email",
      headerName: "Email",
      minWidth: 200,
      flex: 1,
      valueGetter: (_, row) => row.email || "-",
    },
    {
      field: "telefono",
      headerName: "Telefono",
      minWidth: 140,
      flex: 0.85,
      valueGetter: (_, row) => row.telefono || "-",
    },
    {
      field: "purchaseCount",
      headerName: "Compras",
      type: "number",
      minWidth: 100,
      flex: 0.55,
      align: "right",
      headerAlign: "right",
    },
    {
      field: "actions",
      headerName: "Accion",
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      minWidth: 140,
      flex: 0.7,
      renderCell: (params) => (
        <MuiButton
          type="button"
          size="small"
          variant="contained"
          onClick={() => onSelectCustomer(params.row)}
        >
          Seleccionar
        </MuiButton>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#4a3c58]/30 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl rounded-2xl border border-[#e8d5e5] bg-[#fdfcf5] shadow-xl">
        <div className="border-b border-[#e8d5e5]/60 p-5">
          <h3 className="text-lg font-semibold text-[#4a3c58]">Buscar cliente</h3>
          <p className="mt-1 text-sm text-[#4a3c58]/70">
            Selecciona un cliente que ya compró antes o que fue registrado en ventas anteriores.
          </p>
        </div>

        <div className="space-y-3 p-5">
          <div>
            <Label htmlFor="customer-search">Buscar por identificacion, nombre, email o telefono</Label>
            <Input
              id="customer-search"
              placeholder="Ej: 0950..., GISMAR, cliente@correo.com"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <DataGrid
              rows={customers}
              columns={customerColumns}
              getRowId={(row) => row.id}
              loading={customerLoading}
              disableRowSelectionOnClick
              disableColumnMenu
              pageSizeOptions={[8, 15, 25]}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 8 },
                },
              }}
              localeText={{
                noRowsLabel: "No se encontraron clientes con ese criterio.",
              }}
              sx={{
                ...modalDataGridSx,
                height: 430,
              }}
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-100 p-5">
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}

type ProductPickerModalProps = {
  isOpen: boolean;
  productSearch: string;
  setProductSearch: Dispatch<SetStateAction<string>>;
  filteredProducts: Product[];
  selectedProductIds: string[];
  toggleProductSelection: (productId: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ProductPickerModal({
  isOpen,
  productSearch,
  setProductSearch,
  filteredProducts,
  selectedProductIds,
  toggleProductSelection,
  onCancel,
  onConfirm,
}: ProductPickerModalProps) {
  if (!isOpen) {
    return null;
  }

  const selectionModel = useMemo<GridRowSelectionModel>(
    () => ({
      type: "include",
      ids: new Set(selectedProductIds),
    }),
    [selectedProductIds],
  );

  const productColumns: GridColDef<Product>[] = [
    {
      field: "codigo",
      headerName: "Codigo",
      minWidth: 130,
      flex: 0.75,
      renderCell: (params) => (
        <span className="font-semibold text-[#4a3c58]">{params.row.codigo}</span>
      ),
    },
    {
      field: "nombre",
      headerName: "Producto",
      minWidth: 240,
      flex: 1.35,
    },
    {
      field: "precio",
      headerName: "Precio",
      type: "number",
      minWidth: 120,
      flex: 0.7,
      align: "right",
      headerAlign: "right",
      valueFormatter: (value) => `$${Number(value).toFixed(2)}`,
    },
    {
      field: "stock",
      headerName: "Stock",
      type: "number",
      minWidth: 120,
      flex: 0.7,
      align: "right",
      headerAlign: "right",
      valueFormatter: (value) => Number(value).toFixed(3),
    },
  ];

  function onSelectionChange(model: GridRowSelectionModel) {
    const nextIds = new Set(Array.from(model.ids, (id) => String(id)));
    const currentIds = new Set(selectedProductIds);
    const mergedIds = new Set([...currentIds, ...nextIds]);

    for (const id of mergedIds) {
      if (currentIds.has(id) !== nextIds.has(id)) {
        toggleProductSelection(id);
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#4a3c58]/30 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-[#e8d5e5] bg-[#fdfcf5] shadow-xl">
        <div className="border-b border-[#e8d5e5]/60 p-5">
          <h3 className="text-lg font-semibold text-[#4a3c58]">Seleccionar productos</h3>
          <p className="mt-1 text-sm text-[#4a3c58]/70">Busca, marca los productos y agregalos al detalle de la venta.</p>
        </div>
        <div className="space-y-3 p-5">
          <div>
            <Label htmlFor="picker-search">Buscar producto</Label>
            <Input
              id="picker-search"
              placeholder="Busca por codigo o nombre"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <DataGrid
              rows={filteredProducts}
              columns={productColumns}
              checkboxSelection
              keepNonExistentRowsSelected
              disableColumnMenu
              rowSelectionModel={selectionModel}
              onRowSelectionModelChange={onSelectionChange}
              pageSizeOptions={[8, 15, 25]}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 8 },
                },
              }}
              localeText={{
                noRowsLabel: "No hay coincidencias con tu busqueda.",
              }}
              sx={{
                ...modalDataGridSx,
                height: 430,
              }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 p-5">
          <p className="text-sm text-slate-600">Seleccionados: {selectedProductIds.length}</p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="button" onClick={onConfirm}>
              Agregar al detalle
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

type InvoiceDetailModalProps = {
  isOpen: boolean;
  loading: boolean;
  cancelling: boolean;
  invoice: SriInvoiceDetail | null;
  onCancelSaleAndInvoice: (invoiceId: string) => void;
  onClose: () => void;
};

export function InvoiceDetailModal({
  isOpen,
  loading,
  cancelling,
  invoice,
  onCancelSaleAndInvoice,
  onClose,
}: InvoiceDetailModalProps) {
  if (!isOpen) return null;
  const serviceInvoiceId = invoice?.externalInvoiceId ?? invoice?.id ?? "";
  const isAuthorized = invoice?.status === "AUTHORIZED";
  const isCancelled = invoice?.sale?.status === "CANCELLED";
  const canDownloadXml = isAuthorized && Boolean(serviceInvoiceId);
  const canDownloadRide = isAuthorized && Boolean(serviceInvoiceId);
  const formattedCreatedAt = invoice?.createdAt
    ? new Date(invoice.createdAt).toLocaleString("es-EC")
    : "-";
  const formattedAuthorizedAt = invoice?.authorizedAt
    ? new Date(invoice.authorizedAt).toLocaleString("es-EC")
    : "-";
  const invoiceItemsColumns: GridColDef<SriInvoiceDetail["sale"]["items"][number]>[] = [
    {
      field: "codigo",
      headerName: "Codigo",
      minWidth: 140,
      flex: 0.8,
      valueGetter: (_, row) => row.product.codigo,
      renderCell: (params) => (
        <span className="font-semibold text-[#4a3c58]">{params.row.product.codigo}</span>
      ),
    },
    {
      field: "producto",
      headerName: "Producto",
      minWidth: 240,
      flex: 1.4,
      valueGetter: (_, row) => row.product.nombre,
    },
    {
      field: "cantidad",
      headerName: "Cant",
      type: "number",
      minWidth: 110,
      flex: 0.6,
      align: "right",
      headerAlign: "right",
      valueFormatter: (value) => Number(value).toFixed(3),
    },
    {
      field: "precioUnitario",
      headerName: "Precio Unit",
      type: "number",
      minWidth: 130,
      flex: 0.7,
      align: "right",
      headerAlign: "right",
      valueFormatter: (value) => `$${Number(value).toFixed(2)}`,
    },
    {
      field: "total",
      headerName: "Total",
      type: "number",
      minWidth: 130,
      flex: 0.7,
      align: "right",
      headerAlign: "right",
      valueFormatter: (value) => `$${Number(value).toFixed(2)}`,
      renderCell: (params) => (
        <span className="font-semibold text-[#4a3c58]">${Number(params.row.total).toFixed(2)}</span>
      ),
    },
  ];
  const invoiceItemsGridHeight = invoice
    ? Math.min(Math.max(invoice.sale.items.length * 52 + 58, 220), 420)
    : 220;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#4a3c58]/30 backdrop-blur-sm p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-[#e8d5e5] bg-[#fdfcf5] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#e8d5e5]/60 p-5">
          <div>
            <h3 className="text-lg font-semibold text-[#4a3c58]">Detalle Factura SRI</h3>
            {!loading && invoice ? (
              <p className="text-sm text-[#4a3c58]/70">
                Venta #{invoice.saleNumber}
                {invoice.secuencial ? ` · Factura ${invoice.secuencial}` : ""}
              </p>
            ) : null}
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>

        {loading ? (
          <div className="flex min-h-[260px] items-center justify-center p-6">
            <div className="flex items-center gap-2 text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando detalle de factura...
            </div>
          </div>
        ) : !invoice ? (
          <div className="flex min-h-[260px] items-center justify-center p-6 text-sm text-slate-500">
            No se pudo cargar el detalle de la factura.
          </div>
        ) : (
          <div className="overflow-y-auto p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <section className="space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
              <h4 className="font-medium text-slate-800">Estado SRI</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Estado:</span>
                  <span className="font-semibold">{invoice.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estado venta:</span>
                  <span className={isCancelled ? "font-semibold text-red-600" : "font-semibold text-emerald-700"}>
                    {isCancelled ? "ANULADA" : "COMPLETADA"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Intentos:</span>
                  <span>{invoice.retryCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Secuencial:</span>
                  <span className="font-semibold">{invoice.secuencial ?? "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha registro:</span>
                  <span>{formattedCreatedAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha autorizacion:</span>
                  <span>{formattedAuthorizedAt}</span>
                </div>
                {invoice.authorizationNumber && (
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500">No. Autorizacion:</span>
                    <span className="break-all font-mono text-xs">{invoice.authorizationNumber}</span>
                  </div>
                )}
                {invoice.claveAcceso && (
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500">Clave Acceso:</span>
                    <span className="break-all font-mono text-xs">{invoice.claveAcceso}</span>
                  </div>
                )}
                {invoice.lastError && (
                  <div className="mt-2 rounded bg-red-50 p-2 text-xs text-red-700">
                    <strong>Error:</strong> {invoice.lastError}
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-3 rounded-lg border border-slate-100 bg-white p-4">
              <h4 className="font-medium text-slate-800">Cliente</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Razon Social:</span>
                  <span className="font-semibold">{invoice.sale.customer.razonSocial}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Identificacion:</span>
                  <span>{invoice.sale.customer.identificacion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span>{invoice.sale.customer.email || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Direccion:</span>
                  <span className="text-right">{invoice.sale.customer.direccion || "-"}</span>
                </div>
              </div>
            </section>
          </div>

          <section className="mt-6">
            <h4 className="mb-3 font-medium text-slate-800">Items de la Venta</h4>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <DataGrid
                rows={invoice.sale.items}
                columns={invoiceItemsColumns}
                getRowId={(row) => row.id}
                disableColumnMenu
                disableRowSelectionOnClick
                hideFooter
                sx={{
                  ...modalDataGridSx,
                  height: invoiceItemsGridHeight,
                  minHeight: invoiceItemsGridHeight,
                  "& .MuiDataGrid-footerContainer": {
                    display: "none",
                  },
                }}
              />
            </div>
          </section>

          <section className="mt-6 flex flex-col items-end gap-2 text-sm">
            <div className="flex w-full max-w-xs justify-between border-b border-slate-100 py-1">
              <span className="text-slate-600">Subtotal:</span>
              <span>${Number(invoice.sale.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex w-full max-w-xs justify-between border-b border-slate-100 py-1">
              <span className="text-slate-600">IVA:</span>
              <span>${Number(invoice.sale.taxTotal).toFixed(2)}</span>
            </div>
            <div className="flex w-full max-w-xs justify-between py-1 text-base font-bold text-emerald-700">
              <span>Total:</span>
              <span>${Number(invoice.sale.total).toFixed(2)}</span>
            </div>
          </section>

          <section className="mt-6 rounded-lg bg-slate-50 p-4">
            <h4 className="mb-2 font-medium text-slate-800">Reimpresion de Comprobantes</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!canDownloadRide}
                onClick={() => {
                  if (!canDownloadRide) return;
                  window.open(`/api/v1/sri-invoices/${serviceInvoiceId}/ride`, "_blank", "noopener,noreferrer");
                }}
              >
                Descargar PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!canDownloadXml}
                onClick={() => {
                  if (!canDownloadXml) return;
                  window.open(`/api/v1/sri-invoices/${serviceInvoiceId}/xml`, "_blank", "noopener,noreferrer");
                }}
              >
                Descargar XML
              </Button>
            </div>
            {!isAuthorized ? (
              <p className="mt-2 text-xs text-slate-500">Se habilitan cuando la factura esta autorizada.</p>
            ) : null}
          </section>
          </div>
        )}
        
        <div className="flex items-center justify-between border-t border-slate-100 p-4">
          <Button
            type="button"
            variant="destructive"
            disabled={loading || !invoice || isCancelled || cancelling}
            onClick={() => {
              if (!invoice) return;
              void onCancelSaleAndInvoice(invoice.id);
            }}
          >
            {cancelling ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Anulando...
              </>
            ) : isCancelled ? (
              "Venta anulada"
            ) : (
              "Anular venta/factura"
            )}
          </Button>
          <Button onClick={onClose}>Cerrar Detalle</Button>
        </div>
      </div>
    </div>
  );
}
