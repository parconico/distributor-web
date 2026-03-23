"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { get, post, del } from "@/lib/api-client";
import {
  Remito,
  Producto,
  PaginatedResponse,
  EstadoRemito,
} from "@/types";
import { formatEstadoRemito, estadoRemitoVariant } from "@/lib/formatters";
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
import { Loader2, Trash2, Download } from "lucide-react";
import { AxiosError } from "axios";
import apiClient from "@/lib/api-client";

export default function RemitoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [remito, setRemito] = useState<Remito | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);

  const [productos, setProductos] = useState<Producto[]>([]);
  const [selectedProductoId, setSelectedProductoId] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchRemito = useCallback(async () => {
    try {
      const data = await get<Remito>(`/remitos/${params.id}`);
      setRemito(data);
    } catch {
      toast({
        title: "Error",
        description: "No se pudo cargar el remito",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchRemito();
  }, [fetchRemito]);

  useEffect(() => {
    if (remito?.estado === EstadoRemito.BORRADOR) {
      get<PaginatedResponse<Producto>>("/productos?page=1&limit=100")
        .then((res) => setProductos(res.data))
        .catch(() => {});
    }
  }, [remito?.estado]);

  const isDraft = remito?.estado === EstadoRemito.BORRADOR;
  const isConfirmed = remito?.estado === EstadoRemito.CONFIRMADO;

  const filteredProductos = productos.filter((p) => {
    if (!searchTerm) return true;
    const lower = searchTerm.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(lower) ||
      p.codigo.toLowerCase().includes(lower)
    );
  });

  const handleAddItem = async () => {
    if (!remito || !selectedProductoId) return;
    const producto = productos.find((p) => p.id === selectedProductoId);
    if (!producto) return;

    try {
      setIsActioning(true);
      await post(`/remitos/${remito.id}/items`, {
        productoId: producto.id,
        cantidad,
      });
      toast({ title: "Producto agregado" });
      setSelectedProductoId("");
      setSearchTerm("");
      setCantidad(1);
      await fetchRemito();
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
    if (!remito) return;
    try {
      setIsActioning(true);
      await del(`/remitos/${remito.id}/items/${itemId}`);
      toast({ title: "Item eliminado" });
      await fetchRemito();
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
    if (!remito) return;
    try {
      setIsActioning(true);
      await post(`/remitos/${remito.id}/confirmar`);
      toast({ title: "Remito confirmado" });
      await fetchRemito();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ?? "No se pudo confirmar el remito",
        variant: "destructive",
      });
    } finally {
      setIsActioning(false);
    }
  };

  const handleAnular = async () => {
    if (!remito) return;
    try {
      setIsActioning(true);
      await post(`/remitos/${remito.id}/anular`);
      toast({ title: "Remito anulado" });
      await fetchRemito();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ?? "No se pudo anular el remito",
        variant: "destructive",
      });
    } finally {
      setIsActioning(false);
    }
  };

  const handleEliminar = async () => {
    if (!remito) return;
    try {
      setIsActioning(true);
      await del(`/remitos/${remito.id}`);
      toast({ title: "Remito eliminado" });
      router.push("/remitos");
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ?? "No se pudo eliminar el remito",
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

  if (!remito) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Remito no encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <h1 className="text-2xl font-bold">Remito #{remito.numero}</h1>
          <Badge variant={estadoRemitoVariant(remito.estado)}>
            {formatEstadoRemito(remito.estado)}
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
                    Confirmar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar remito</AlertDialogTitle>
                    <AlertDialogDescription>
                      Una vez confirmado, no se podrán modificar los items.
                      {remito.afectaStock &&
                        " Se descontará el stock de los productos."}{" "}
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
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isActioning}>
                    Eliminar borrador
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminar remito</AlertDialogTitle>
                    <AlertDialogDescription>
                      ¿Está seguro de que desea eliminar el remito #{remito.numero}?
                      Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleEliminar}>
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          {isConfirmed && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isActioning}>
                  Anular
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Anular remito</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. ¿Está seguro de que
                    desea anular este remito?
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
          )}
          {remito.estado !== "BORRADOR" && (
            <Button
              variant="outline"
              onClick={async () => {
                const res = await apiClient.get(`/remitos/${params.id}/pdf`, { responseType: 'blob' });
                const url = URL.createObjectURL(res.data as Blob);
                window.open(url);
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar PDF
            </Button>
          )}
          <Button variant="outline" onClick={() => router.push("/remitos")}>
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
                {new Date(remito.createdAt).toLocaleDateString("es-AR")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">
                {remito.cliente?.razonSocial ?? "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Afecta stock</p>
              <p className="font-medium">{remito.afectaStock ? "Sí" : "No"}</p>
            </div>
            {remito.ventaId && (
              <div>
                <p className="text-sm text-muted-foreground">Venta asociada</p>
                <p className="font-medium">
                  <Link
                    href={`/ventas/${remito.ventaId}`}
                    className="text-primary hover:underline"
                  >
                    Ver venta #{remito.venta?.numero ?? remito.ventaId}
                  </Link>
                </p>
              </div>
            )}
            {remito.observaciones && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Observaciones</p>
                <p className="font-medium">{remito.observaciones}</p>
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
                  {isDraft && <TableHead className="w-16">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {remito.items && remito.items.length > 0 ? (
                  remito.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.producto
                          ? `${item.producto.codigo} - ${item.producto.nombre}`
                          : item.productoId}
                      </TableCell>
                      <TableCell>{item.cantidad}</TableCell>
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
                      colSpan={isDraft ? 3 : 2}
                      className="h-24 text-center"
                    >
                      Sin items.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
