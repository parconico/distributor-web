"use client";

import { useEffect, useState, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { get } from "@/lib/api-client";
import { downloadFile } from "@/lib/download";
import { Venta, Cliente, User, EstadoVenta } from "@/types";
import {
  formatCurrency,
  formatEstadoVenta,
  estadoVentaVariant,
} from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import { DataTable } from "@/components/tables/data-table";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download } from "lucide-react";

interface ReporteVentasData {
  ventas: Venta[];
  resumen: {
    count: number;
    subtotal: number;
    totalIva: number;
    total: number;
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

export default function ReporteVentasPage() {
  const [fechaDesde, setFechaDesde] = useState(getDefaultFechaDesde());
  const [fechaHasta, setFechaHasta] = useState(getDefaultFechaHasta());
  const [clienteId, setClienteId] = useState<string>("all");
  const [vendedorId, setVendedorId] = useState<string>("all");
  const [data, setData] = useState<ReporteVentasData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vendedores, setVendedores] = useState<User[]>([]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [clientesRes, vendedoresRes] = await Promise.all([
          get<{ data: Cliente[] }>("/clientes?page=1&limit=500"),
          get<User[]>("/users"),
        ]);
        setClientes(clientesRes.data ?? []);
        setVendedores(Array.isArray(vendedoresRes) ? vendedoresRes : []);
      } catch {
        // Silently fail for filters
      }
    };
    fetchFilters();
  }, []);

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    params.set("fechaDesde", fechaDesde);
    params.set("fechaHasta", fechaHasta);
    if (clienteId && clienteId !== "all") params.set("clienteId", clienteId);
    if (vendedorId && vendedorId !== "all") params.set("vendedorId", vendedorId);
    return params.toString();
  }, [fechaDesde, fechaHasta, clienteId, vendedorId]);

  const fetchReporte = async () => {
    setIsLoading(true);
    try {
      const result = await get<ReporteVentasData>(
        `/reportes/ventas?${buildQueryString()}`
      );
      setData(result);
    } catch {
      toast({
        title: "Error",
        description: "No se pudo generar el reporte de ventas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCsv = () => {
    const qs = buildQueryString();
    downloadFile(
      `/reportes/ventas/csv?${qs}`,
      `reporte-ventas-${fechaDesde}-${fechaHasta}.csv`
    );
  };

  const handleExportExcel = () => {
    const qs = buildQueryString();
    downloadFile(
      `/reportes/ventas/excel?${qs}`,
      `reporte-ventas-${fechaDesde}-${fechaHasta}.xlsx`
    );
  };

  const columns: ColumnDef<Venta>[] = [
    {
      accessorKey: "createdAt",
      header: "Fecha",
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString("es-AR"),
    },
    {
      accessorKey: "numero",
      header: "Número",
    },
    {
      id: "cliente",
      header: "Cliente",
      cell: ({ row }) => row.original.cliente?.razonSocial ?? "-",
    },
    {
      id: "vendedor",
      header: "Vendedor",
      cell: ({ row }) => {
        const v = row.original.vendedor;
        return v ? `${v.firstName} ${v.lastName}` : "-";
      },
    },
    {
      accessorKey: "subtotal",
      header: "Subtotal",
      cell: ({ row }) => formatCurrency(row.original.subtotal),
    },
    {
      accessorKey: "totalIva",
      header: "IVA",
      cell: ({ row }) => formatCurrency(row.original.totalIva),
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => formatCurrency(row.original.total),
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => (
        <Badge variant={estadoVentaVariant(row.original.estado as EstadoVenta)}>
          {formatEstadoVenta(row.original.estado as EstadoVenta)}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reporte de Ventas</h1>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-5 items-end">
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
              <Label>Cliente</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.razonSocial}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vendedor</Label>
              <Select value={vendedorId} onValueChange={setVendedorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {vendedores.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.firstName} {v.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={fetchReporte} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.resumen.count}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Subtotal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(data.resumen.subtotal)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">IVA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(data.resumen.totalIva)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(data.resumen.total)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCsv}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
            <Button variant="outline" onClick={handleExportExcel}>
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
          </div>

          {/* Table */}
          <DataTable
            columns={columns}
            data={data.ventas}
            searchKey="numero"
            searchPlaceholder="Buscar ventas..."
          />
        </>
      )}
    </div>
  );
}
