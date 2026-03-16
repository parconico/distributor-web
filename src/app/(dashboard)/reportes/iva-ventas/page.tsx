"use client";

import { useState } from "react";
import { get } from "@/lib/api-client";
import { downloadFile } from "@/lib/download";
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
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Download } from "lucide-react";

interface IvaVentasRow {
  alicuota: number;
  baseImponible: number;
  importeIva: number;
}

interface IvaVentasData {
  rows: IvaVentasRow[];
  totales: {
    baseImponible: number;
    importeIva: number;
  };
}

function getDefaultFechaDesde(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function getDefaultFechaHasta(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function IvaVentasPage() {
  const [fechaDesde, setFechaDesde] = useState(getDefaultFechaDesde());
  const [fechaHasta, setFechaHasta] = useState(getDefaultFechaHasta());
  const [data, setData] = useState<IvaVentasData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const buildQueryString = () => {
    const params = new URLSearchParams();
    params.set("fechaDesde", fechaDesde);
    params.set("fechaHasta", fechaHasta);
    return params.toString();
  };

  const fetchReporte = async () => {
    setIsLoading(true);
    try {
      const result = await get<IvaVentasData>(
        `/reportes/iva-ventas?${buildQueryString()}`
      );
      setData(result);
    } catch {
      toast({
        title: "Error",
        description: "No se pudo generar el reporte de IVA ventas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    const qs = buildQueryString();
    downloadFile(
      `/reportes/iva-ventas/excel?${qs}`,
      `iva-ventas-${fechaDesde}-${fechaHasta}.xlsx`
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">IVA Ventas</h1>

      {/* Filtros */}
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

      {/* Resultados */}
      {data && (
        <>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportExcel}>
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detalle por Alícuota</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alícuota (%)</TableHead>
                      <TableHead className="text-right">Base Imponible</TableHead>
                      <TableHead className="text-right">Importe IVA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.rows.length > 0 ? (
                      data.rows.map((row) => (
                        <TableRow key={row.alicuota}>
                          <TableCell>{row.alicuota}%</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(row.baseImponible)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(row.importeIva)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                          Sin datos para el período seleccionado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  {data.rows.length > 0 && (
                    <TableFooter>
                      <TableRow>
                        <TableCell className="font-bold">Totales</TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(data.totales.baseImponible)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(data.totales.importeIva)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
