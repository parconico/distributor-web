"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { get, post, del } from "@/lib/api-client";
import {
  Venta,
  EstadoVenta,
  Producto,
  PaginatedResponse,
  Role,
} from "@/types";
import {
  formatCurrency,
  formatListaPrecio,
  formatEstadoVenta,
  estadoVentaVariant,
  formatMetodoPago,
} from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RoleGate } from "@/components/shared/role-gate";
import { Loader2, Trash2, Download } from "lucide-react";
import apiClient from "@/lib/api-client";
import { AxiosError } from "axios";

export default function VentaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [venta, setVenta] = useState<Venta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);

  // Add item state (only for BORRADOR)
  const [productos, setProductos] = useState<Producto[]>([]);
  const [selectedProductoId, setSelectedProductoId] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchVenta = useCallback(async () => {
    try {
      const data = await get<Venta>(`/ventas/${params.id}`);
      setVenta(data);
    } catch {
      toast({
        title: "Error",
        description: "No se pudo cargar la venta",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchVenta();
  }, [fetchVenta]);

  useEffect(() => {
    if (venta?.estado === EstadoVenta.BORRADOR) {
      get<PaginatedResponse<Producto>>("/productos?page=1&limit=100")
        .then((res) => setProductos(res.data))
        .catch(() => {});
    }
  }, [venta?.estado]);

  const isDraft = venta?.estado === EstadoVenta.BORRADOR;
  const isConfirmed = venta?.estado === EstadoVenta.CONFIRMADA;

  const getPrecioForLista = (producto: Producto): number => {
    if (!venta) return 0;
    const precio = producto.precios?.find(
      (p) => p.listaPrecio === venta.listaPrecio
    );
    return precio?.precioNeto ?? 0;
  };

  const filteredProductos = productos.filter((p) => {
    if (!searchTerm) return true;
    const lower = searchTerm.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(lower) ||
      p.codigo.toLowerCase().includes(lower)
    );
  });

  const handleAddItem = async () => {
    if (!venta || !selectedProductoId) return;
    const producto = productos.find((p) => p.id === selectedProductoId);
    if (!producto) return;

    try {
      setIsActioning(true);
      await post(`/ventas/${venta.id}/items`, {
        productoId: producto.id,
        cantidad,
        precioUnitario: getPrecioForLista(producto),
      });
      toast({ title: "Producto agregado" });
      setSelectedProductoId("");
      setSearchTerm("");
      setCantidad(1);
      await fetchVenta();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ?? "No se pudo agregar el item",
        variant: "destructive",
      });
    } finally {
      setIsActioning(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!venta) return;
    try {
      setIsActioning(true);
      await del(`/ventas/${venta.id}/items/${itemId}`);
      toast({ title: "Item eliminado" });
      await fetchVenta();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ?? "No se pudo eliminar el item",
        variant: "destructive",
      });
    } finally {
      setIsActioning(false);
    }
  };

  const handleConfirmar = async () => {
    if (!venta) return;
    try {
      setIsActioning(true);
      await post(`/ventas/${venta.id}/confirmar`);
      toast({ title: "Venta confirmada" });
      await fetchVenta();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ?? "No se pudo confirmar la venta",
        variant: "destructive",
      });
    } finally {
      setIsActioning(false);
    }
  };

  const handleAnular = async () => {
    if (!venta) return;
    try {
      setIsActioning(true);
      await post(`/ventas/${venta.id}/anular`);
      toast({ title: "Venta anulada" });
      await fetchVenta();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ?? "No se pudo anular la venta",
        variant: "destructive",
      });
    } finally {
      setIsActioning(false);
    }
  };

  const handleFacturar = async () => {
    if (!venta) return;
    try {
      setIsActioning(true);
      const result = await post<{ cae?: string; caeFechaVenc?: string }>(
        "/arca/facturar",
        { ventaId: venta.id }
      );
      toast({
        title: "Venta facturada",
        description: result.cae
          ? `CAE: ${result.cae} - Venc: ${result.caeFechaVenc}`
          : "Comprobante generado correctamente",
      });
      await fetchVenta();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error al facturar",
        description:
          axiosError.response?.data?.message ?? "No se pudo facturar la venta",
        variant: "destructive",
      });
    } finally {
      setIsActioning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!venta) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Venta no encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Venta #{venta.numero}</h1>
          <Badge variant={estadoVentaVariant(venta.estado)}>
            {formatEstadoVenta(venta.estado)}
          </Badge>
          {venta.tipoVenta === "EN_NEGRO" ? (
            <Badge variant="outline" className="border-orange-300 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
              En negro
            </Badge>
          ) : (
            <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              En blanco
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isDraft && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={isActioning}>
                  {isActioning && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Confirmar Venta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar venta</AlertDialogTitle>
                  <AlertDialogDescription>
                    Una vez confirmada, no se podrán modificar los items. ¿Desea
                    continuar?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmar}>
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {isConfirmed && (
            <>
              {venta.tipoVenta === "EN_BLANCO" && (
                <RoleGate allowedRoles={[Role.ADMIN, Role.CONTADOR]}>
                  <Button onClick={handleFacturar} disabled={isActioning}>
                    {isActioning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Facturar
                  </Button>
                </RoleGate>
              )}
              {venta.tipoVenta === "EN_NEGRO" && venta.ticketInterno && (
                <>
                  <Badge variant="secondary">
                    Ticket #{venta.ticketInterno.numero}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const res = await apiClient.get(`/arca/tickets/${venta.ticketInterno!.id}/pdf`, { responseType: 'blob' });
                      const url = URL.createObjectURL(res.data as Blob);
                      window.open(url);
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Descargar Ticket
                  </Button>
                </>
              )}
              <RoleGate allowedRoles={[Role.ADMIN]}>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isActioning}>
                      Anular
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Anular venta</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. ¿Está seguro de que
                        desea anular esta venta?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleAnular}>
                        Anular
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </RoleGate>
            </>
          )}
          <Button variant="outline" onClick={() => router.push("/ventas")}>
            Volver
          </Button>
        </div>
      </div>

      {/* Header Info */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Fecha</p>
              <p className="font-medium">
                {new Date(venta.createdAt).toLocaleDateString("es-AR")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">
                {venta.cliente?.razonSocial ?? "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vendedor</p>
              <p className="font-medium">
                {venta.vendedor
                  ? `${venta.vendedor.firstName} ${venta.vendedor.lastName}`
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lista de Precio</p>
              <p className="font-medium">
                {formatListaPrecio(venta.listaPrecio)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo de Venta</p>
              <p className="font-medium">{venta.tipoVenta === "EN_BLANCO" ? "En blanco (fiscal)" : "En negro (ticket)"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Discrimina IVA</p>
              <p className="font-medium">{venta.conIva ? "Sí" : "No"}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">Métodos de Pago</p>
              <div className="mt-1 space-y-1">
                {venta.pagos.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 text-sm font-medium">
                    <span>{formatMetodoPago(p.metodoPago)}</span>
                    {p.monto > 0 && (
                      <span className="text-muted-foreground">— {formatCurrency(p.monto)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {venta.diasCredito && (
              <div>
                <p className="text-sm text-muted-foreground">Días de Crédito</p>
                <p className="font-medium">{venta.diasCredito} días</p>
              </div>
            )}
            {venta.fechaVencimiento && (
              <div>
                <p className="text-sm text-muted-foreground">Vencimiento</p>
                <p className="font-medium">
                  {new Date(venta.fechaVencimiento).toLocaleDateString("es-AR")}
                </p>
              </div>
            )}
            {venta.descuentoTotal > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Descuento General</p>
                <p className="font-medium">{venta.descuentoTotal}%</p>
              </div>
            )}
            {venta.observaciones && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Observaciones</p>
                <p className="font-medium">{venta.observaciones}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Items (Draft only) */}
      {isDraft && (
        <Card>
          <CardHeader>
            <CardTitle>Agregar producto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label>Producto</Label>
                <Select
                  value={selectedProductoId}
                  onValueChange={setSelectedProductoId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Buscar producto..." />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <Input
                        placeholder="Buscar por nombre o código..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mb-2"
                      />
                    </div>
                    {filteredProductos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.codigo} - {p.nombre} (Stock: {p.stockActual})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-28 space-y-2">
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(Number(e.target.value))}
                />
              </div>
              <Button
                onClick={handleAddItem}
                disabled={!selectedProductoId || isActioning}
              >
                Agregar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Precio Unit.</TableHead>
                  <TableHead>Dto. %</TableHead>
                  <TableHead>IVA %</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>IVA</TableHead>
                  <TableHead>Total</TableHead>
                  {isDraft && <TableHead className="w-16">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {venta.items && venta.items.length > 0 ? (
                  venta.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.producto
                          ? `${item.producto.codigo} - ${item.producto.nombre}`
                          : item.productoId}
                      </TableCell>
                      <TableCell>{item.cantidad}</TableCell>
                      <TableCell>{formatCurrency(item.precioUnitario)}</TableCell>
                      <TableCell>{item.descuento > 0 ? `${item.descuento}%` : "-"}</TableCell>
                      <TableCell>{item.alicuotaIva}%</TableCell>
                      <TableCell>{formatCurrency(item.subtotal)}</TableCell>
                      <TableCell>{formatCurrency(item.montoIva)}</TableCell>
                      <TableCell>{formatCurrency(item.total)}</TableCell>
                      {isDraft && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={isActioning}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={isDraft ? 10 : 9}
                      className="h-24 text-center"
                    >
                      Sin items.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Totals */}
          <div className="mt-4 flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">
                  {formatCurrency(venta.subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total IVA:</span>
                <span className="font-medium">{formatCurrency(venta.totalIva)}</span>
              </div>
              {venta.totalDescuento > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento ({venta.descuentoTotal}%):</span>
                  <span className="font-medium">-{formatCurrency(venta.totalDescuento)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2">
                <span className="text-lg font-bold">Total:</span>
                <span className="text-lg font-bold">{formatCurrency(venta.total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
