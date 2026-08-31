"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { post } from "@/lib/api-client";
import { Cliente, MetodoPago, Producto, ListaPrecio } from "@/types";
import { formatCurrency, formatListaPrecio, formatMetodoPago } from "@/lib/formatters";
import { aplicarDescuento, calcularLineaVenta } from "@/lib/iva-calculator";
import { useRemoteOptions } from "@/hooks/use-remote-options";
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

type ModoDescuento = "PCT" | "MONTO";

interface LocalItem {
  productoId: string;
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  descuentoMonto: number;
  // Cual de los dos campos esta activo. Lo guardamos aparte del valor para que
  // el modo elegido no se pierda cuando el descuento vuelve a 0.
  descuentoModo: ModoDescuento;
  alicuotaIva: number;
  subtotal: number;
  montoIva: number;
  total: number;
}

export default function NuevaVentaPage() {
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);

  const [clienteId, setClienteId] = useState("");
  const [listaPrecio, setListaPrecio] = useState<ListaPrecio | "">("");
  const [tipoVenta, setTipoVenta] = useState<"EN_BLANCO" | "EN_NEGRO">("EN_BLANCO");
  const [conIva, setConIva] = useState(true);
  const [descuentoGeneral, setDescuentoGeneral] = useState(0);
  const [descuentoGeneralMonto, setDescuentoGeneralMonto] = useState(0);
  const [descuentoGeneralModo, setDescuentoGeneralModo] = useState<ModoDescuento>("PCT");
  const [pagos, setPagos] = useState<{ metodoPago: MetodoPago; monto: number }[]>([
    { metodoPago: MetodoPago.CUENTA_CORRIENTE, monto: 0 },
  ]);
  const [diasCredito, setDiasCredito] = useState(30);
  const [observaciones, setObservaciones] = useState("");

  const [selectedProductoId, setSelectedProductoId] = useState("");
  // Guardamos el producto elegido, no solo su id: la lista de opciones cambia
  // con cada busqueda y el seleccionado puede no estar en la tanda actual.
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState(1);

  const {
    options: clientes,
    search: clienteSearch,
    setSearch: setClienteSearch,
    ocultas: clientesOcultos,
  } = useRemoteOptions<Cliente>("/clientes");

  const {
    options: productos,
    search: searchTerm,
    setSearch: setSearchTerm,
    ocultas: productosOcultos,
  } = useRemoteOptions<Producto>("/productos");

  const [items, setItems] = useState<LocalItem[]>([]);


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
      toast({ title: "Error", description: "La cantidad debe ser mayor a 0", variant: "destructive" });
      return;
    }

    const existing = items.find((i) => i.productoId === selectedProducto.id);
    if (existing) {
      toast({ title: "Producto ya agregado", description: "Modifique la cantidad en la tabla", variant: "destructive" });
      return;
    }

    const precioUnitario = getPrecioForLista(selectedProducto);
    const linea = calcularLineaVenta(precioUnitario, cantidad, selectedProducto.alicuotaIva, conIva, 0, 0);

    setItems((prev) => [
      ...prev,
      {
        productoId: selectedProducto.id,
        producto: selectedProducto,
        cantidad,
        precioUnitario,
        descuento: 0,
        descuentoMonto: 0,
        descuentoModo: "PCT",
        alicuotaIva: selectedProducto.alicuotaIva,
        ...linea,
      },
    ]);

    setSelectedProductoId("");
    setSelectedProducto(null);
    setSearchTerm("");
    setCantidad(1);
  };

  const handleRemoveItem = (productoId: string) => {
    setItems((prev) => prev.filter((i) => i.productoId !== productoId));
  };

  const recalcItem = (
    item: LocalItem,
    newCantidad: number,
    newDescuento: number,
    newDescuentoMonto: number
  ): LocalItem => {
    const linea = calcularLineaVenta(
      item.precioUnitario,
      newCantidad,
      item.alicuotaIva,
      conIva,
      newDescuento,
      newDescuentoMonto
    );
    return {
      ...item,
      cantidad: newCantidad,
      descuento: newDescuento,
      descuentoMonto: newDescuentoMonto,
      ...linea,
    };
  };

  const handleUpdateCantidad = (productoId: string, newCantidad: number) => {
    if (newCantidad <= 0) return;
    setItems((prev) => prev.map((item) => item.productoId !== productoId ? item : recalcItem(item, newCantidad, item.descuento, item.descuentoMonto)));
  };

  const handleUpdateDescuento = (productoId: string, valor: number) => {
    if (valor < 0) return;
    setItems((prev) =>
      prev.map((item) => {
        if (item.productoId !== productoId) return item;
        if (item.descuentoModo === "PCT") {
          if (valor > 100) return item;
          return recalcItem(item, item.cantidad, valor, 0);
        }
        return recalcItem(item, item.cantidad, 0, valor);
      })
    );
  };

  // Cambiar de % a $ (o al reves) resetea el valor: los numeros no son
  // equivalentes entre modos y arrastrarlos daria un descuento inesperado.
  const handleToggleModoDescuento = (productoId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.productoId !== productoId) return item;
        const nuevoModo: ModoDescuento = item.descuentoModo === "PCT" ? "MONTO" : "PCT";
        return { ...recalcItem(item, item.cantidad, 0, 0), descuentoModo: nuevoModo };
      })
    );
  };

  const totals = useMemo(() => {
    const subtotalItems = items.reduce((acc, i) => acc + i.subtotal, 0);
    const totalIvaItems = items.reduce((acc, i) => acc + i.montoIva, 0);
    const totalItems = items.reduce((acc, i) => acc + i.total, 0);
    // El descuento en pesos se traduce al factor equivalente para que el IVA
    // baje en la misma proporcion que el neto.
    const pct = descuentoGeneralModo === "PCT" ? descuentoGeneral : 0;
    const monto = descuentoGeneralModo === "MONTO" ? descuentoGeneralMonto : 0;
    const totalConDescuento = aplicarDescuento(totalItems, pct, monto);
    const factor = totalItems > 0 ? totalConDescuento / totalItems : 1;
    return {
      subtotal: Math.round(subtotalItems * factor * 100) / 100,
      totalIva: Math.round(totalIvaItems * factor * 100) / 100,
      totalDescuento: Math.round((totalItems - totalItems * factor) * 100) / 100,
      total: Math.round(totalItems * factor * 100) / 100,
    };
  }, [items, descuentoGeneral, descuentoGeneralMonto, descuentoGeneralModo]);

  const handleSave = async () => {
    if (!clienteId) {
      toast({ title: "Error", description: "Debe seleccionar un cliente", variant: "destructive" });
      return;
    }
    if (!listaPrecio) {
      toast({ title: "Error", description: "Debe seleccionar una lista de precio", variant: "destructive" });
      return;
    }
    if (items.length === 0) {
      toast({ title: "Error", description: "Debe agregar al menos un producto", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const venta = await post<{ id: string }>("/ventas", {
        clienteId,
        listaPrecio,
        tipoVenta,
        conIva,
        descuentoTotal: descuentoGeneralModo === "PCT" ? descuentoGeneral : 0,
        descuentoMonto: descuentoGeneralModo === "MONTO" ? descuentoGeneralMonto : 0,
        pagos,
        diasCredito: pagos.some(p => p.metodoPago === MetodoPago.CUENTA_CORRIENTE) ? diasCredito : undefined,
        observaciones: observaciones || undefined,
      });

      for (const item of items) {
        await post(`/ventas/${venta.id}/items`, {
          productoId: item.productoId,
          cantidad: item.cantidad,
          descuento: item.descuento,
          descuentoMonto: item.descuentoMonto,
        });
      }

      const remito = await post<{ id: string }>("/remitos", {
        clienteId,
        ventaId: venta.id,
      });
      for (const item of items) {
        await post(`/remitos/${remito.id}/items`, {
          productoId: item.productoId,
          cantidad: item.cantidad,
        });
      }

      toast({ title: "Venta creada correctamente" });
      router.push(`/ventas/${venta.id}`);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description: axiosError.response?.data?.message ?? "No se pudo crear la venta",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Nueva Venta</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos de la venta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select value={clienteId} onValueChange={handleClienteChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Buscar por nombre o documento..."
                      value={clienteSearch}
                      onChange={(e) => setClienteSearch(e.target.value)}
                      className="mb-2"
                    />
                  </div>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.razonSocial}
                    </SelectItem>
                  ))}
                  {clientesOcultos > 0 && (
                    <p className="px-2 py-1.5 text-xs text-muted-foreground">
                      +{clientesOcultos} más. Afiná la búsqueda.
                    </p>
                  )}
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
              <Label>Tipo de Venta</Label>
              <Select value={tipoVenta} onValueChange={(v) => setTipoVenta(v as "EN_BLANCO" | "EN_NEGRO")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EN_BLANCO">En blanco (fiscal)</SelectItem>
                  <SelectItem value="EN_NEGRO">En negro (ticket interno)</SelectItem>
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

            <div className="space-y-2">
              <Label>Dto. General</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-12 shrink-0 font-semibold"
                  onClick={() => {
                    // Cambiar de modo resetea el valor: 20% y $20 no son lo mismo.
                    setDescuentoGeneralModo((m) => (m === "PCT" ? "MONTO" : "PCT"));
                    setDescuentoGeneral(0);
                    setDescuentoGeneralMonto(0);
                  }}
                  title="Alternar entre porcentaje y pesos"
                >
                  {descuentoGeneralModo === "PCT" ? "%" : "$"}
                </Button>
                {descuentoGeneralModo === "PCT" ? (
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={descuentoGeneral}
                    onChange={(e) => setDescuentoGeneral(Number(e.target.value))}
                  />
                ) : (
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={descuentoGeneralMonto}
                    onChange={(e) => setDescuentoGeneralMonto(Number(e.target.value))}
                  />
                )}
              </div>
            </div>

            <div className="space-y-3 lg:col-span-3">
              <Label>Método de Pago</Label>
              <div className="space-y-2">
                {Object.values(MetodoPago).map((mp) => {
                  const pago = pagos.find(p => p.metodoPago === mp);
                  const checked = !!pago;
                  return (
                    <div key={mp} className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer w-44">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                          checked={checked}
                          onChange={(e) =>
                            setPagos(prev =>
                              e.target.checked
                                ? [...prev, { metodoPago: mp, monto: 0 }]
                                : prev.filter(p => p.metodoPago !== mp)
                            )
                          }
                        />
                        <span className="text-sm">{formatMetodoPago(mp)}</span>
                      </label>
                      {checked && (
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Monto"
                          className="w-36"
                          value={pago.monto || ""}
                          onChange={(e) =>
                            setPagos(prev =>
                              prev.map(p =>
                                p.metodoPago === mp ? { ...p, monto: Number(e.target.value) } : p
                              )
                            )
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {pagos.some(p => p.metodoPago === MetodoPago.CUENTA_CORRIENTE) && (
              <div className="space-y-2">
                <Label>Días de crédito</Label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={diasCredito}
                  onChange={(e) => setDiasCredito(Number(e.target.value))}
                />
              </div>
            )}
          </div>

          {tipoVenta === "EN_NEGRO" && (
            <div className="mt-3">
              <Badge variant="outline" className="border-orange-300 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                Venta en negro - Se generara un ticket interno (sin factura fiscal)
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
              <Select
                value={selectedProductoId}
                onValueChange={(id) => {
                  setSelectedProductoId(id);
                  setSelectedProducto(productos.find((p) => p.id === id) ?? null);
                }}
              >
                <SelectTrigger>
                  {/* Sin children: Radix usa este span como contenedor de portal
                      para la opcion elegida y escribirle texto encima rompe. */}
                  <SelectValue placeholder="Buscar producto..." />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Buscar por nombre o codigo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="mb-2"
                    />
                  </div>
                  {productos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.codigo} - {p.nombre} (Stock: {p.stockActual})
                    </SelectItem>
                  ))}
                  {productosOcultos > 0 && (
                    <p className="px-2 py-1.5 text-xs text-muted-foreground">
                      +{productosOcultos} más. Afiná la búsqueda.
                    </p>
                  )}
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

            <Button onClick={handleAddItem} disabled={!selectedProductoId || !listaPrecio}>
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
                    <TableHead className="w-20">Dto. %</TableHead>
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
                          onChange={(e) => handleUpdateCantidad(item.productoId, Number(e.target.value))}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>{formatCurrency(item.precioUnitario)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-9 shrink-0 px-0 font-semibold"
                            onClick={() => handleToggleModoDescuento(item.productoId)}
                            title="Alternar entre porcentaje y pesos"
                          >
                            {item.descuentoModo === "PCT" ? "%" : "$"}
                          </Button>
                          <Input
                            type="number"
                            min="0"
                            {...(item.descuentoModo === "PCT"
                              ? { max: 100, step: 0.5 }
                              : { step: 0.01 })}
                            value={item.descuentoModo === "PCT" ? item.descuento : item.descuentoMonto}
                            onChange={(e) => handleUpdateDescuento(item.productoId, Number(e.target.value))}
                            className="w-20"
                          />
                        </div>
                      </TableCell>
                      <TableCell>{item.alicuotaIva}%</TableCell>
                      <TableCell>{formatCurrency(item.subtotal)}</TableCell>
                      <TableCell>{formatCurrency(item.montoIva)}</TableCell>
                      <TableCell>{formatCurrency(item.total)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(item.productoId)}>
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
            <div className="space-y-2 text-right">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total IVA:</span>
                <span className="font-medium">{formatCurrency(totals.totalIva)}</span>
              </div>
              {totals.totalDescuento > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>
                    Descuento
                    {descuentoGeneralModo === "PCT" && descuentoGeneral > 0
                      ? ` (${descuentoGeneral}%)`
                      : ""}
                    :
                  </span>
                  <span className="font-medium">-{formatCurrency(totals.totalDescuento)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2">
                <span className="text-lg font-bold">Total:</span>
                <span className="text-lg font-bold">{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-6">
            <Button variant="outline" onClick={() => router.push("/ventas")} disabled={isSaving}>
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
