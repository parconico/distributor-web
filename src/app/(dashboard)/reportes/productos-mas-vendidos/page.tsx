"use client";

import { useState } from "react";
import { get } from "@/lib/api-client";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";

interface ProductoMasVendido {
  productoId: string;
  codigo: string;
  nombre: string;
  cantidadTotal: number;
  montoTotal: number;
}

function getDefaultFechaDesde(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function getDefaultFechaHasta(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function ProductosMasVendidosPage() {
  const [fechaDesde, setFechaDesde] = useState(getDefaultFechaDesde());
  const [fechaHasta, setFechaHasta] = useState(getDefaultFechaHasta());
  const [limite, setLimite] = useState("50");
  const [data, setData] = useState<ProductoMasVendido[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReporte = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("fechaDesde", fechaDesde);
      params.set("fechaHasta", fechaHasta);
      if (limite) params.set("limite", limite);
      const result = await get<ProductoMasVendido[]>(
        `/reportes/productos-mas-vendidos?${params.toString()}`
      );
      setData(Array.isArray(result) ? result : []);
    } catch {
      toast({
        title: "Error",
        description: "No se pudo generar el reporte de productos más vendidos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Productos Más Vendidos</h1>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="fechaDesde">Fecha Desde</Label>
              <Input
                id="fechaDesde"
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fechaHasta">Fecha Hasta</Label>
              <Input
                id="fechaHasta"
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="limite">Límite</Label>
              <Input
                id="limite"
                type="number"
                min={1}
                max={500}
                value={limite}
                onChange={(e) => setLimite(e.target.value)}
              />
            </div>
            <Button onClick={fetchReporte} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {data !== null && (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-right">Cantidad Vendida</TableHead>
                  <TableHead className="text-right">Monto Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No hay datos para el período seleccionado
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item, index) => (
                    <TableRow key={item.productoId}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{item.codigo}</TableCell>
                      <TableCell>{item.nombre}</TableCell>
                      <TableCell className="text-right">{item.cantidadTotal}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.montoTotal)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
