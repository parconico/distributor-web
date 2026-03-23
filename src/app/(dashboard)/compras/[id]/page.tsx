"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { get, post, del } from "@/lib/api-client";
import {
  Compra,
  EstadoCompra,
  Producto,
  PaginatedResponse,
  Role,
} from "@/types";
import { formatCurrency, formatEstadoCompra, estadoCompraVariant } from "@/lib/formatters";
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
import { Loader2, Trash2 } from "lucide-react";
import { AxiosError } from "axios";

export default function CompraDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [compra, setCompra] = useState<Compra | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);

  const [productos, setProductos] = useState<Producto[]>([]);
  const [selectedProductoId, setSelectedProductoId] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [precioUnitario, setPrecioUnitario] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCompra = useCallback(async () => {
    try {
      const data = await get<Compra>(`/compras/${params.id}`);
      setCompra(data);
    } catch {
      toast({
        title: "Error",
        description: "No se pudo cargar la compra",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchCompra();
  }, [fetchCompra]);

  useEffect(() => {
    if (compra?.estado === EstadoCompra.BORRADOR) {
      get<PaginatedResponse<Producto>>("/productos?page=1&limit=100")
        .then((res) => setProductos(res.data))
        .catch(() => {});
    }
  }, [compra?.estado]);

  const isDraft = compra?.estado === EstadoCompra.BORRADOR;
  const isConfirmada = compra?.estado === EstadoCompra.CONFIRMADA;
  const isRecibida = compra?.estado === EstadoCompra.RECIBIDA;
  const canAnular = isConfirmada || isRecibida;

  const filteredProductos = productos.filter((p) => {
    if (!searchTerm) return true;
    const lower = searchTerm.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(lower) ||
      p.codigo.toLowerCase().includes(lower)
    );
  });

  const selectedProducto = productos.find((p) => p.id === selectedProductoId);

  useEffect(() => {
    if (selectedProducto) {
      setPrecioUnitario(0);
    }
  }, [selectedProductoId]);

  const handleAddItem = async () => {
    if (!compra || !selectedProductoId || !selectedProducto) return;
    if (cantidad <= 0 || precioUnitario < 0) {
      toast({
        title: "Error",
        description: "Cantidad y precio deben ser válidos",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsActioning(true);
      await post(`/compras/${compra.id}/items`, {
        productoId: selectedProducto.id,
        cantidad,
        precioUnitario,
        alicuotaIva: selectedProducto.alicuotaIva,
      });
      toast({ title: "Producto agregado" });
      setSelectedProductoId("");
      setSearchTerm("");
      setCantidad(1);
      setPrecioUnitario(0);
      await fetchCompra();
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
    if (!compra) return;
    try {
      setIsActioning(true);
      await del(`/compras/${compra.id}/items/${itemId}`);
      toast({ title: "Item eliminado" });
      await fetchCompra();
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
    if (!compra) return;
    try {
      setIsActioning(true);
      await post(`/compras/${compra.id}/confirmar`);
      toast({ title: "Compra confirmada" });
      await fetchCompra();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ?? "No se pudo confirmar la compra",
        variant: "destructive",
      });
    } finally {
      setIsActioning(false);
    }
  };

  const handleRecibir = async () => {
    if (!compra) return;
    try {
      setIsActioning(true);
      await post(`/compras/${compra.id}/recibir`);
      toast({ title: "Compra recibida - Stock actualizado" });
      await fetchCompra();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ?? "No se pudo marcar como recibida",
        variant: "destructive",
      });
    } finally {
      setIsActioning(false);
    }
  };

  const handleAnular = async () => {
    if (!compra) return;
    try {
      setIsActioning(true);
      await post(`/compras/${compra.id}/anular`);
      toast({ title: "Compra anulada" });
      await fetchCompra();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ?? "No se pudo anular la compra",
        variant: "destructive",
      });
    } finally {
      setIsActioning(false);
    }
  };

  const handleDelete = async () => {
    if (!compra) return;
    try {
      setIsActioning(true);
      await del(`/compras/${compra.id}`);
      toast({ title: "Compra eliminada" });
      router.push("/compras");
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ?? "No se pudo eliminar la compra",
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

  if (!compra) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Compra no encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <h1 className="text-2xl font-bold">Compra #{compra.numero}</h1>
          <Badge variant={estadoCompraVariant(compra.estado)}>
            {formatEstadoCompra(compra.estado)}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {isDraft && (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={isActioning}>
                    {isActioning && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Confirmar Compra
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar compra</AlertDialogTitle>
                    <AlertDialogDescription>
                      Una vez confirmada, no se podrán modificar los items.
                      ¿Desea continuar?
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
              <RoleGate allowedRoles={[Role.ADMIN, Role.DEPOSITO]}>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isActioning}>
                      Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Eliminar compra</AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Está seguro de que desea eliminar esta compra en
                        borrador? Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </RoleGate>
            </>
          )}
          {isConfirmada && (
            <RoleGate allowedRoles={[Role.ADMIN, Role.DEPOSITO]}>
              <Button onClick={handleRecibir} disabled={isActioning}>
                {isActioning && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Recibir (stock entra)
              </Button>
            </RoleGate>
          )}
          {canAnular && (
            <RoleGate allowedRoles={[Role.ADMIN, Role.DEPOSITO]}>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isActioning}>
                    Anular
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Anular compra</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. ¿Está seguro de que
                      desea anular esta compra?
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
          )}
          <Button variant="outline" onClick={() => router.push("/compras")}>
            Volver
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Fecha</p>
              <p className="font-medium">
                {new Date(compra.createdAt).toLocaleDateString("es-AR")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Proveedor</p>
              <p className="font-medium">
                {compra.proveedor?.razonSocial ?? "-"}
              </p>
            </div>
            {compra.observaciones && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Observaciones</p>
                <p className="font-medium">{compra.observaciones}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isDraft && (
        <Card>
          <CardHeader>
            <CardTitle>Agregar producto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px] space-y-2">
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
                        {p.codigo} - {p.nombre} (IVA: {p.alicuotaIva}%)
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
              <div className="w-36 space-y-2">
                <Label>Precio de compra</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={precioUnitario || ""}
                  onChange={(e) =>
                    setPrecioUnitario(Number(e.target.value) || 0)
                  }
                  placeholder="0.00"
                />
              </div>
              <Button
                onClick={handleAddItem}
                disabled={
                  !selectedProductoId ||
                  cantidad <= 0 ||
                  precioUnitario < 0 ||
                  isActioning
                }
              >
                Agregar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                  <TableHead>IVA %</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>IVA</TableHead>
                  <TableHead>Total</TableHead>
                  {isDraft && <TableHead className="w-16">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {compra.items && compra.items.length > 0 ? (
                  compra.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.producto
                          ? `${item.producto.codigo} - ${item.producto.nombre}`
                          : item.productoId}
                      </TableCell>
                      <TableCell>{item.cantidad}</TableCell>
                      <TableCell>{formatCurrency(item.precioUnitario)}</TableCell>
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
                      colSpan={isDraft ? 8 : 7}
                      className="h-24 text-center"
                    >
                      Sin items.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">
                  {formatCurrency(compra.subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total IVA:</span>
                <span className="font-medium">
                  {formatCurrency(compra.totalIva)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-lg font-bold">Total:</span>
                <span className="text-lg font-bold">
                  {formatCurrency(compra.total)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
