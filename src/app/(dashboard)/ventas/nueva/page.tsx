"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { get, post } from "@/lib/api-client";
import {
  Cliente,
  Producto,
  PaginatedResponse,
  ListaPrecio,
  VentaItem,
} from "@/types";
import { formatCurrency, formatListaPrecio } from "@/lib/formatters";
import { calcularLineaVenta } from "@/lib/iva-calculator";
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
import { Loader2, Trash2 } from "lucide-react";
import { AxiosError } from "axios";

interface LocalItem {
  productoId: string;
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
  alicuotaIva: number;
  subtotal: number;
  montoIva: number;
  total: number;
}

export default function NuevaVentaPage() {
  const router = useRouter();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Header state
  const [clienteId, setClienteId] = useState("");
  const [listaPrecio, setListaPrecio] = useState<ListaPrecio | "">("");
  const [conIva, setConIva] = useState(true);
  const [observaciones, setObservaciones] = useState("");

  // Add item state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductoId, setSelectedProductoId] = useState("");
  const [cantidad, setCantidad] = useState(1);

  // Items
  const [items, setItems] = useState<LocalItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientesRes, productosRes] = await Promise.all([
          get<PaginatedResponse<Cliente>>("/clientes?page=1&limit=100"),
          get<PaginatedResponse<Producto>>("/productos?page=1&limit=100"),
        ]);
        setClientes(clientesRes.data);
        setProductos(productosRes.data);
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

  const handleClienteChange = useCallback(
    (id: string) => {
      setClienteId(id);
      const cliente = clientes.find((c) => c.id === id);
      if (cliente) {
        setListaPrecio(cliente.listaPrecio);
      }
    },
    [clientes]
  );

  const filteredProductos = useMemo(() => {
    if (!searchTerm) return productos;
    const lower = searchTerm.toLowerCase();
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(lower) ||
        p.codigo.toLowerCase().includes(lower)
    );
  }, [productos, searchTerm]);

  const selectedProducto = useMemo(
    () => productos.find((p) => p.id === selectedProductoId),
    [productos, selectedProductoId]
  );

  const getPrecioForLista = useCallback(
    (producto: Producto): number => {
      if (!listaPrecio) return 0;
      const precio = producto.precios?.find(
        (p) => p.listaPrecio === listaPrecio
      );
      return precio?.precioNeto ?? 0;
    },
    [listaPrecio]
  );

  const handleAddItem = () => {
    if (!selectedProducto || !listaPrecio) return;
    if (cantidad <= 0) {
      toast({
        title: "Error",
        description: "La cantidad debe ser mayor a 0",
        variant: "destructive",
      });
      return;
    }

    const existing = items.find((i) => i.productoId === selectedProducto.id);
    if (existing) {
      toast({
        title: "Producto ya agregado",
        description: "Modifique la cantidad en la tabla",
        variant: "destructive",
      });
      return;
    }

    const precioUnitario = getPrecioForLista(selectedProducto);
    const linea = calcularLineaVenta(
      precioUnitario,
      cantidad,
      selectedProducto.alicuotaIva,
      conIva
    );

    setItems((prev) => [
      ...prev,
      {
        productoId: selectedProducto.id,
        producto: selectedProducto,
        cantidad,
        precioUnitario,
        alicuotaIva: selectedProducto.alicuotaIva,
        ...linea,
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
      prev.map((item) => {
        if (item.productoId !== productoId) return item;
        const linea = calcularLineaVenta(
          item.precioUnitario,
          newCantidad,
          item.alicuotaIva,
          conIva
        );
        return { ...item, cantidad: newCantidad, ...linea };
      })
    );
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, i) => acc + i.subtotal, 0);
    const totalIva = items.reduce((acc, i) => acc + i.montoIva, 0);
    const total = items.reduce((acc, i) => acc + i.total, 0);
    return { subtotal, totalIva, total };
  }, [items]);

  const handleSave = async () => {
    if (!clienteId) {
      toast({
        title: "Error",
        description: "Debe seleccionar un cliente",
        variant: "destructive",
      });
      return;
    }
    if (!listaPrecio) {
      toast({
        title: "Error",
        description: "Debe seleccionar una lista de precio",
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
      const venta = await post<{ id: string }>("/ventas", {
        clienteId,
        listaPrecio,
        conIva,
        observaciones: observaciones || undefined,
      });

      for (const item of items) {
        await post(`/ventas/${venta.id}/items`, {
          productoId: item.productoId,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
        });
      }

      toast({ title: "Venta creada correctamente" });
      router.push(`/ventas/${venta.id}`);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ?? "No se pudo crear la venta",
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nueva Venta</h1>
      </div>

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Datos de la venta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select value={clienteId} onValueChange={handleClienteChange}>
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
              <Label>Lista de Precio *</Label>
              <Select
                value={listaPrecio}
                onValueChange={(val) => setListaPrecio(val as ListaPrecio)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar lista" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ListaPrecio).map((lp) => (
                    <SelectItem key={lp} value={lp}>
                      {formatListaPrecio(lp)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Discriminar IVA</Label>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  checked={conIva}
                  onChange={(e) => setConIva(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                  id="conIva"
                />
                <Label htmlFor="conIva" className="font-normal">
                  {conIva ? "Sí" : "No"}
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Items */}
      <Card>
        <CardHeader>
          <CardTitle>Agregar productos</CardTitle>
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

            {selectedProducto && (
              <div className="space-y-2">
                <Label>Precio</Label>
                <p className="text-sm pt-2">
                  {formatCurrency(getPrecioForLista(selectedProducto))}
                </p>
              </div>
            )}

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
              disabled={!selectedProductoId || !listaPrecio}
            >
              Agregar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
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
                    <TableHead className="w-28">Cantidad</TableHead>
                    <TableHead>Precio Unit.</TableHead>
                    <TableHead>Alícuota IVA</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead>IVA</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="w-16">Acciones</TableHead>
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
                        {formatCurrency(item.precioUnitario)}
                      </TableCell>
                      <TableCell>{item.alicuotaIva}%</TableCell>
                      <TableCell>{formatCurrency(item.subtotal)}</TableCell>
                      <TableCell>{formatCurrency(item.montoIva)}</TableCell>
                      <TableCell>{formatCurrency(item.total)}</TableCell>
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

      {/* Totals & Actions */}
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
            <div className="space-y-2 text-right">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">
                  {formatCurrency(totals.subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total IVA:</span>
                <span className="font-medium">
                  {formatCurrency(totals.totalIva)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-lg font-bold">Total:</span>
                <span className="text-lg font-bold">
                  {formatCurrency(totals.total)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-6">
            <Button
              variant="outline"
              onClick={() => router.push("/ventas")}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Borrador
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
