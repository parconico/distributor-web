"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { get, post } from "@/lib/api-client";
import { Proveedor, Producto, PaginatedResponse } from "@/types";
import { formatCurrency } from "@/lib/formatters";
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

export default function NuevaCompraPage() {
  const router = useRouter();

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [proveedorId, setProveedorId] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductoId, setSelectedProductoId] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [precioUnitario, setPrecioUnitario] = useState(0);

  const [items, setItems] = useState<LocalItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [proveedoresRes, productosRes] = await Promise.all([
          get<PaginatedResponse<Proveedor>>("/proveedores?page=1&limit=100"),
          get<PaginatedResponse<Producto>>("/productos?page=1&limit=100"),
        ]);
        setProveedores(proveedoresRes.data);
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

  useEffect(() => {
    if (selectedProducto) {
      setPrecioUnitario(0);
    }
  }, [selectedProductoId]);

  const handleAddItem = () => {
    if (!selectedProducto) return;
    if (cantidad <= 0) {
      toast({
        title: "Error",
        description: "La cantidad debe ser mayor a 0",
        variant: "destructive",
      });
      return;
    }
    if (precioUnitario < 0) {
      toast({
        title: "Error",
        description: "El precio debe ser mayor o igual a 0",
        variant: "destructive",
      });
      return;
    }

    const existing = items.find((i) => i.productoId === selectedProducto.id);
    if (existing) {
      toast({
        title: "Producto ya agregado",
        description: "Modifique la cantidad o precio en la tabla",
        variant: "destructive",
      });
      return;
    }

    const linea = calcularLineaVenta(
      precioUnitario,
      cantidad,
      selectedProducto.alicuotaIva,
      true,
      0
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
    setPrecioUnitario(0);
  };

  const handleRemoveItem = (productoId: string) => {
    setItems((prev) => prev.filter((i) => i.productoId !== productoId));
  };

  const recalcItem = (
    item: LocalItem,
    newCantidad: number,
    newPrecio: number
  ): LocalItem => {
    const linea = calcularLineaVenta(
      newPrecio,
      newCantidad,
      item.alicuotaIva,
      true,
      0
    );
    return { ...item, cantidad: newCantidad, precioUnitario: newPrecio, ...linea };
  };

  const handleUpdateCantidad = (productoId: string, newCantidad: number) => {
    if (newCantidad <= 0) return;
    setItems((prev) =>
      prev.map((item) =>
        item.productoId !== productoId
          ? item
          : recalcItem(item, newCantidad, item.precioUnitario)
      )
    );
  };

  const handleUpdatePrecio = (productoId: string, newPrecio: number) => {
    if (newPrecio < 0) return;
    setItems((prev) =>
      prev.map((item) =>
        item.productoId !== productoId
          ? item
          : recalcItem(item, item.cantidad, newPrecio)
      )
    );
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, i) => acc + i.subtotal, 0);
    const totalIva = items.reduce((acc, i) => acc + i.montoIva, 0);
    const total = items.reduce((acc, i) => acc + i.total, 0);
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalIva: Math.round(totalIva * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }, [items]);

  const handleSave = async () => {
    if (!proveedorId) {
      toast({
        title: "Error",
        description: "Debe seleccionar un proveedor",
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
      const compra = await post<{ id: string }>("/compras", {
        proveedorId,
        observaciones: observaciones || undefined,
      });

      for (const item of items) {
        await post(`/compras/${compra.id}/items`, {
          productoId: item.productoId,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          alicuotaIva: item.alicuotaIva,
        });
      }

      toast({ title: "Compra creada correctamente" });
      router.push(`/compras/${compra.id}`);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ?? "No se pudo crear la compra",
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
        <h1 className="text-2xl font-bold">Nueva Compra</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos de la compra</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Proveedor *</Label>
              <Select value={proveedorId} onValueChange={setProveedorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {proveedores.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.razonSocial}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Observaciones opcionales..."
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agregar productos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px] space-y-2">
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
                onChange={(e) => setPrecioUnitario(Number(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>

            {selectedProducto && (
              <div className="space-y-2">
                <Label>IVA (auto)</Label>
                <p className="text-sm pt-2 text-muted-foreground">
                  {selectedProducto.alicuotaIva}%
                </p>
              </div>
            )}

            <Button
              onClick={handleAddItem}
              disabled={!selectedProductoId || cantidad <= 0}
            >
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
                    <TableHead>Precio Unit.</TableHead>
                    <TableHead>IVA %</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead>IVA</TableHead>
                    <TableHead>Total</TableHead>
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
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.precioUnitario}
                          onChange={(e) =>
                            handleUpdatePrecio(
                              item.productoId,
                              Number(e.target.value)
                            )
                          }
                          className="w-24"
                        />
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

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-right">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total IVA:</span>
                <span className="font-medium">{formatCurrency(totals.totalIva)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-lg font-bold">Total:</span>
                <span className="text-lg font-bold">{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-6">
            <Button
              variant="outline"
              onClick={() => router.push("/compras")}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving || items.length === 0}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Borrador
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
