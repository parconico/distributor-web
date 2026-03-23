"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { get, post } from "@/lib/api-client";
import {
  Cliente,
  Producto,
  Venta,
  PaginatedResponse,
  EstadoVenta,
} from "@/types";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2 } from "lucide-react";
import { AxiosError } from "axios";

interface LocalItem {
  productoId: string;
  producto: Producto;
  cantidad: number;
}

export default function NuevoRemitoPage() {
  const router = useRouter();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [clienteId, setClienteId] = useState("");
  const [ventaId, setVentaId] = useState<string>("");
  const [observaciones, setObservaciones] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductoId, setSelectedProductoId] = useState("");
  const [cantidad, setCantidad] = useState(1);

  const [items, setItems] = useState<LocalItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientesRes, productosRes, ventasRes] = await Promise.all([
          get<PaginatedResponse<Cliente>>("/clientes?page=1&limit=100"),
          get<PaginatedResponse<Producto>>("/productos?page=1&limit=100"),
          get<PaginatedResponse<Venta>>("/ventas?page=1&limit=200"),
        ]);
        setClientes(clientesRes.data);
        setProductos(productosRes.data);
        setVentas(
          ventasRes.data.filter(
            (v) =>
              v.estado === EstadoVenta.CONFIRMADA ||
              v.estado === EstadoVenta.FACTURADA
          )
        );
      } catch {
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos",
          variant: "destructive",
        });
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const filteredProductos = useMemo(() => {
    if (!searchTerm) return productos;
    const lower = searchTerm.toLowerCase();
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(lower) ||
        p.codigo.toLowerCase().includes(lower)
    );
  }, [productos, searchTerm]);

  const ventasDelCliente = useMemo(() => {
    if (!clienteId) return ventas;
    return ventas.filter((v) => v.clienteId === clienteId);
  }, [ventas, clienteId]);

  const handleAddItem = () => {
    const producto = productos.find((p) => p.id === selectedProductoId);
    if (!producto) return;
    if (cantidad <= 0) {
      toast({
        title: "Error",
        description: "La cantidad debe ser mayor a 0",
        variant: "destructive",
      });
      return;
    }

    const existing = items.find((i) => i.productoId === producto.id);
    if (existing) {
      toast({
        title: "Producto ya agregado",
        description: "Modifique la cantidad en la tabla",
        variant: "destructive",
      });
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        productoId: producto.id,
        producto,
        cantidad,
      },
    ]);

    setSelectedProductoId("");
    setSearchTerm("");
    setCantidad(1);
  };

  const handleRemoveItem = (productoId: string) => {
    setItems((prev) => prev.filter((i) => i.productoId !== productoId));
  };

  const handleUpdateCantidad = (productoId: string, newCantidad: number) => {
    if (newCantidad <= 0) return;
    setItems((prev) =>
      prev.map((item) =>
        item.productoId !== productoId ? item : { ...item, cantidad: newCantidad }
      )
    );
  };

  const handleSave = async () => {
    if (!clienteId) {
      toast({
        title: "Error",
        description: "Debe seleccionar un cliente",
        variant: "destructive",
      });
      return;
    }
    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un producto",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const remito = await post<{ id: string }>("/remitos", {
        clienteId,
        ventaId: ventaId || undefined,
        observaciones: observaciones || undefined,
      });

      for (const item of items) {
        await post(`/remitos/${remito.id}/items`, {
          productoId: item.productoId,
          cantidad: item.cantidad,
        });
      }

      toast({ title: "Remito creado correctamente" });
      router.push(`/remitos/${remito.id}`);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ?? "No se pudo crear el remito",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Nuevo Remito</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del remito</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select value={clienteId} onValueChange={(v) => {
                setClienteId(v);
                setVentaId("");
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.razonSocial}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Venta (opcional)</Label>
              <Select
                value={ventaId || "none"}
                onValueChange={(v) => setVentaId(v === "none" ? "" : v)}
                disabled={!clienteId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin venta asociada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin venta asociada</SelectItem>
                  {ventasDelCliente.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      Venta #{v.numero} - {new Date(v.createdAt).toLocaleDateString("es-AR")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {ventaId && (
            <div className="mt-3">
              <Badge
                variant="outline"
                className="border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
              >
                Vinculado a venta: no afecta stock (ya manejado por la venta)
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agregar productos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label>Producto</Label>
              <Select value={selectedProductoId} onValueChange={setSelectedProductoId}>
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

            <Button onClick={handleAddItem} disabled={!selectedProductoId}>
              Agregar
            </Button>
          </div>
        </CardContent>
      </Card>

      {items.length > 0 && (
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
                    <TableHead className="w-24">Cantidad</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.productoId}>
                      <TableCell>
                        {item.producto.codigo} - {item.producto.nombre}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.cantidad}
                          onChange={(e) =>
                            handleUpdateCantidad(
                              item.productoId,
                              Number(e.target.value)
                            )
                          }
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.productoId)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Observaciones opcionales..."
                rows={3}
              />
            </div>
            <div className="flex items-end justify-end">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push("/remitos")}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
