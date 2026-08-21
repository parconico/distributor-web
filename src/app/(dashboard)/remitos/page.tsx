"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Remito, EstadoRemito } from "@/types";
import { formatEstadoRemito, estadoRemitoVariant } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import { PaginatedTable } from "@/components/tables/paginated-table";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Loader2, Plus } from "lucide-react";

export default function RemitosPage() {
  const router = useRouter();
  const [estadoFilter, setEstadoFilter] = useState<string>("all");

  const {
    items: remitos,
    isLoading,
    search,
    setSearch,
    page,
    setPage,
    total,
    totalPages,
    pageSize,
  } = usePaginatedList<Remito>("/remitos", {
    filtros: { estado: estadoFilter === "all" ? undefined : estadoFilter },
    errorMessage: "No se pudieron cargar los remitos",
  });

  const columns: ColumnDef<Remito>[] = [
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
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => (
        <Badge variant={estadoRemitoVariant(row.original.estado)}>
          {formatEstadoRemito(row.original.estado)}
        </Badge>
      ),
    },
    {
      id: "itemsCount",
      header: "Items",
      cell: ({ row }) =>
        row.original.items?.length ?? 0,
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => {
        const remito = row.original;
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/remitos/${remito.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Remitos</h1>
        <Button asChild>
          <Link href="/remitos/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Remito
          </Link>
        </Button>
      </div>
      <PaginatedTable
        columns={columns}
        data={remitos}
        isLoading={isLoading}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por número o cliente..."
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
        entityLabel="remito"
        toolbar={
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.values(EstadoRemito).map((estado) => (
                <SelectItem key={estado} value={estado}>
                  {formatEstadoRemito(estado)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}
