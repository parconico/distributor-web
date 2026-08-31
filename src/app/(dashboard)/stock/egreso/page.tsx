"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "@/lib/api-client";
import { Producto } from "@/types";
import { toast } from "@/hooks/use-toast";
import { useRemoteOptions } from "@/hooks/use-remote-options";
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
import { Loader2 } from "lucide-react";
import { AxiosError } from "axios";

export default function EgresoStockPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [productoId, setProductoId] = useState("");
  // Guardamos el producto elegido, no solo su id: la lista de opciones cambia
  // con cada busqueda y necesitamos el stock disponible para validar.
  const [producto, setProducto] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [motivo, setMotivo] = useState("");

  const {
    options: productos,
    search: searchTerm,
    setSearch: setSearchTerm,
    ocultas: productosOcultos,
  } = useRemoteOptions<Producto>("/productos");

  const stockDisponible = producto ? Number(producto.stockActual) : null;
  const excedeStock = stockDisponible !== null && cantidad > stockDisponible;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productoId) {
      toast({
        title: "Error",
        description: "Debe seleccionar un producto",
        variant: "destructive",
      });
      return;
    }
    if (cantidad <= 0) {
      toast({
        title: "Error",
        description: "La cantidad debe ser mayor a 0",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await post("/stock/egreso", {
        productoId,
        cantidad,
        motivo: motivo.trim() || undefined,
      });
      toast({ title: "Egreso de stock registrado correctamente" });
      router.push("/stock");
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ??
          "No se pudo registrar el egreso",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Egreso de Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Producto *</Label>
              <Select
                value={productoId}
                onValueChange={(id) => {
                  setProductoId(id);
                  setProducto(productos.find((p) => p.id === id) ?? null);
                }}
              >
                <SelectTrigger>
                  {/* Sin children: Radix usa este span como contenedor de portal
                      para la opcion elegida y escribirle texto encima rompe. */}
                  <SelectValue placeholder="Seleccionar producto" />
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
                  {productos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.codigo} - {p.nombre} (Stock actual: {p.stockActual})
                    </SelectItem>
                  ))}
                  {productosOcultos > 0 && (
                    <p className="px-2 py-1.5 text-xs text-muted-foreground">
                      +{productosOcultos} más. Afiná la búsqueda.
                    </p>
                  )}
                </SelectContent>
              </Select>
              {stockDisponible !== null && (
                <p className="text-sm text-muted-foreground">
                  Stock disponible: {stockDisponible}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cantidad">Cantidad a descontar *</Label>
              <Input
                id="cantidad"
                type="number"
                min="1"
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
              />
              {excedeStock && (
                <p className="text-sm text-destructive">
                  La cantidad supera el stock disponible ({stockDisponible}).
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo (opcional)</Label>
              <Input
                id="motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej: Rotura, Vencimiento, Consumo interno..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/stock")}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || excedeStock}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Registrar Egreso
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
