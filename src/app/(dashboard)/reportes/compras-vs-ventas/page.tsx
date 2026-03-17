"use client";

import { useState } from "react";
import { get } from "@/lib/api-client";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface ComprasVsVentasData {
  ventas: { cantidad: number; subtotal: number; total: number };
  compras: { cantidad: number; subtotal: number; total: number };
  margen: { bruto: number; porcentaje: number };
}

function getDefaultFechaDesde(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function getDefaultFechaHasta(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function ComprasVsVentasPage() {
  const [fechaDesde, setFechaDesde] = useState(getDefaultFechaDesde());
  const [fechaHasta, setFechaHasta] = useState(getDefaultFechaHasta());
  const [data, setData] = useState<ComprasVsVentasData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReporte = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("fechaDesde", fechaDesde);
      params.set("fechaHasta", fechaHasta);
      const result = await get<ComprasVsVentasData>(
        `/reportes/compras-vs-ventas?${params.toString()}`
      );
      setData(result);
    } catch {
      toast({
        title: "Error",
        description: "No se pudo generar el reporte de compras vs ventas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const margenPositivo = data ? data.margen.bruto >= 0 : false;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Compras vs Ventas</h1>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3 items-end">
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
            <Button onClick={fetchReporte} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cantidad de Ventas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.ventas.cantidad}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.ventas.total)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Subtotal: {formatCurrency(data.ventas.subtotal)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cantidad de Compras</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.compras.cantidad}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Compras Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.compras.total)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Subtotal: {formatCurrency(data.compras.subtotal)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Margen Bruto</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  margenPositivo ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatCurrency(data.margen.bruto)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Margen %</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  margenPositivo ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                }`}
              >
                {data.margen.porcentaje.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
