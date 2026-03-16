"use client";

import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { get } from "@/lib/api-client";
import {
  MovimientoStock,
  Producto,
  PaginatedResponse,
  TipoMovimientoStock,
} from "@/types";
import { formatTipoMovimiento } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

function tipoMovimientoVariant(
  tipo: TipoMovimientoStock
): "default" | "secondary" | "destructive" | "outline" {
  const map: Record<
    TipoMovimientoStock,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    [TipoMovimientoStock.ENTRADA]: "default",
    [TipoMovimientoStock.SALIDA]: "destructive",
    [TipoMovimientoStock.AJUSTE]: "secondary",
  };
  return map[tipo] ?? "outline";
}

export default function MovimientosStockPage() {
  const [movimientos, setMovimientos] = useState<MovimientoStock[]>([]);
  const [filteredMovimientos, setFilteredMovimientos] = useState<
    MovimientoStock[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tipoFilter, setTipoFilter] = useState<string>("all");
  const [productoFilter, setProductoFilter] = useState<string>("all");
  const [productos, setProductos] = useState<Producto[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [movimientosRes, productosRes] = await Promise.all([
          get<MovimientoStock[]>("/stock/movimientos"),
          get<PaginatedResponse<Producto>>("/productos?page=1&limit=100"),
        ]);
        const movData = Array.isArray(movimientosRes)
          ? movimientosRes
          : (movimientosRes as unknown as PaginatedResponse<MovimientoStock>)
              .data;
        setMovimientos(movData);
        setFilteredMovimientos(movData);
        setProductos(productosRes.data);
      } catch {
        toast({
          title: "Error",
          description: "No se pudieron cargar los movimientos",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = movimientos;
    if (tipoFilter !== "all") {
      filtered = filtered.filter((m) => m.tipo === tipoFilter);
    }
    if (productoFilter !== "all") {
      filtered = filtered.filter((m) => m.productoId === productoFilter);
    }
    setFilteredMovimientos(filtered);
  }, [tipoFilter, productoFilter, movimientos]);

  const columns: ColumnDef<MovimientoStock>[] = [
    {
      accessorKey: "createdAt",
      header: "Fecha",
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString("es-AR"),
    },
    {
      id: "producto",
      header: "Producto",
      cell: ({ row }) =>
        row.original.producto
          ? `${row.original.producto.codigo} - ${row.original.producto.nombre}`
          : row.original.productoId,
    },
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }) => (
        <Badge variant={tipoMovimientoVariant(row.original.tipo)}>
          {formatTipoMovimiento(row.original.tipo)}
        </Badge>
      ),
    },
    {
      accessorKey: "cantidad",
      header: "Cantidad",
      cell: ({ row }) => {
        const m = row.original;
        const sign = m.tipo === TipoMovimientoStock.SALIDA ? "-" : "+";
        return `${sign}${m.cantidad}`;
      },
    },
    {
      accessorKey: "stockPrevio",
      header: "Stock Previo",
    },
    {
      accessorKey: "stockPosterior",
      header: "Stock Posterior",
    },
    {
      accessorKey: "motivo",
      header: "Motivo",
    },
    {
      id: "usuario",
      header: "Usuario",
      cell: ({ row }) => {
        const u = row.original.usuario;
        return u ? `${u.firstName} ${u.lastName}` : "-";
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Movimientos de Stock</h1>
      </div>
      <div className="flex items-center gap-4">
        <Select value={productoFilter} onValueChange={setProductoFilter}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filtrar por producto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los productos</SelectItem>
            {productos.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.codigo} - {p.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {Object.values(TipoMovimientoStock).map((tipo) => (
              <SelectItem key={tipo} value={tipo}>
                {formatTipoMovimiento(tipo)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DataTable
        columns={columns}
        data={filteredMovimientos}
        searchKey="motivo"
        searchPlaceholder="Buscar por motivo..."
      />
    </div>
  );
}
