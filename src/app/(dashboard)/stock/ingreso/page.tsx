"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { get, post } from "@/lib/api-client";
import { Producto, PaginatedResponse } from "@/types";
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

export default function IngresoStockPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [motivo, setMotivo] = useState("");
  const {
    options: productos,
    search: searchTerm,
    setSearch: setSearchTerm,
    ocultas: productosOcultos,
  } = useRemoteOptions<Producto>("/productos");



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
    if (!motivo.trim()) {
      toast({
        title: "Error",
        description: "El motivo es obligatorio",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await post("/stock/ingreso", {
        productoId,
        cantidad,
        motivo: motivo.trim(),
      });
      toast({ title: "Ingreso de stock registrado correctamente" });
      router.push("/stock");
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ??
          "No se pudo registrar el ingreso",
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
          <CardTitle>Ingreso de Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Producto *</Label>
              <Select value={productoId} onValueChange={setProductoId}>
                <SelectTrigger>
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
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cantidad">Cantidad *</Label>
              <Input
                id="cantidad"
                type="number"
                min="1"
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo *</Label>
              <Input
                id="motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej: Compra, Devolución..."
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Registrar Ingreso
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
