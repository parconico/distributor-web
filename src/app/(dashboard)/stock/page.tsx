"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { get } from "@/lib/api-client";
import { Producto, PaginatedResponse } from "@/types";
import { toast } from "@/hooks/use-toast";
import { PaginatedTable } from "@/components/tables/paginated-table";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, PackagePlus, PackageMinus, History } from "lucide-react";

export default function StockPage() {
  const {
    items: productos,
    isLoading,
    search,
    setSearch,
    page,
    setPage,
    total,
    totalPages,
    pageSize,
  } = usePaginatedList<Producto>("/stock", {
    errorMessage: "No se pudo cargar el stock",
  });

  const columns: ColumnDef<Producto>[] = [
    {
      accessorKey: "codigo",
      header: "Código",
    },
    {
      accessorKey: "nombre",
      header: "Producto",
    },
    {
      accessorKey: "stockActual",
      header: "Stock Actual",
    },
    {
      accessorKey: "stockMinimo",
      header: "Stock Mínimo",
    },
    {
      accessorKey: "unidadMedida",
      header: "Unidad",
    },
    {
      id: "estado",
      header: "Estado",
      cell: ({ row }) => {
        const p = row.original;
        const isBajo = p.stockActual < p.stockMinimo;
        return (
          <Badge variant={isBajo ? "destructive" : "default"}>
            {isBajo ? "Bajo Stock" : "OK"}
          </Badge>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Stock</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/stock/movimientos">
              <History className="mr-2 h-4 w-4" />
              Movimientos
            </Link>
          </Button>
          <Button asChild>
            <Link href="/stock/ingreso">
              <PackagePlus className="mr-2 h-4 w-4" />
              Ingreso de Stock
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/stock/egreso">
              <PackageMinus className="mr-2 h-4 w-4" />
              Egreso de Stock
            </Link>
          </Button>
        </div>
      </div>
      <PaginatedTable
        columns={columns}
        data={productos}
        isLoading={isLoading}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por código o nombre..."
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
        entityLabel="producto"
      />
    </div>
  );
}
