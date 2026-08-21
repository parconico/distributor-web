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
import { Input } from "@/components/ui/input";
import { PaginatedTable } from "@/components/tables/paginated-table";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { useRemoteOptions } from "@/hooks/use-remote-options";
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
  const [filteredMovimientos, setFilteredMovimientos] = useState<
    MovimientoStock[]
  >([]);
  const [tipoFilter, setTipoFilter] = useState<string>("all");
  const [productoFilter, setProductoFilter] = useState<string>("all");

  const {
    items: movimientos,
    isLoading,
    search,
    setSearch,
    page,
    setPage,
    total,
    totalPages,
    pageSize,
  } = usePaginatedList<MovimientoStock>("/stock/movimientos", {
    filtros: {
      tipo: tipoFilter === "all" ? undefined : tipoFilter,
      productoId: productoFilter === "all" ? undefined : productoFilter,
    },
    errorMessage: "No se pudieron cargar los movimientos",
  });

  const {
    options: productos,
    search: productoSearch,
    setSearch: setProductoSearch,
  } = useRemoteOptions<Producto>("/productos");



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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Movimientos de Stock</h1>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Select value={productoFilter} onValueChange={setProductoFilter}>
          <SelectTrigger className="w-full sm:w-[250px]">
            <SelectValue placeholder="Filtrar por producto" />
          </SelectTrigger>
          <SelectContent>
            <div className="p-2">
              <Input
                placeholder="Buscar producto..."
                value={productoSearch}
                onChange={(e) => setProductoSearch(e.target.value)}
                className="mb-2"
              />
            </div>
            <SelectItem value="all">Todos los productos</SelectItem>
            {productos.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.codigo} - {p.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
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
      <PaginatedTable
        columns={columns}
        data={movimientos}
        isLoading={isLoading}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por motivo..."
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
        entityLabel="movimiento"
      />
    </div>
  );
}
