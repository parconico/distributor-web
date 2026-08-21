"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface PaginatedTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  // Controles propios de la pantalla (filtros por estado, etc.) al lado del buscador.
  toolbar?: React.ReactNode;
  entityLabel?: string;
}

/**
 * Tabla con buscador y paginador resueltos contra la API. El spinner reemplaza
 * solo a la tabla y nunca al buscador: si se desmontara, el input perderia el
 * foco en cada tecla.
 */
export function PaginatedTable<TData, TValue>({
  columns,
  data,
  isLoading,
  search,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  toolbar,
  entityLabel = "resultado",
}: PaginatedTableProps<TData, TValue>) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full sm:max-w-sm"
        />
        {toolbar}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable columns={columns} data={data} pagination={false} />
      )}

      {!isLoading && total > 0 && (
        <div className="flex flex-col gap-2 px-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {total} {entityLabel}(s) &middot; mostrando{" "}
            {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)}
          </div>
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              Anterior
            </Button>
            <div className="text-xs text-muted-foreground sm:text-sm">
              Pág. {page}/{totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
