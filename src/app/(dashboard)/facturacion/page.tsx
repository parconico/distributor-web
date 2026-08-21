"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Comprobante, Role } from "@/types";
import {
  formatCurrency,
  formatTipoComprobante,
  formatPuntoVentaNumero,
} from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import { PaginatedTable } from "@/components/tables/paginated-table";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RoleGate } from "@/components/shared/role-gate";
import { Eye, Loader2, Settings } from "lucide-react";

export default function FacturacionPage() {
  const router = useRouter();

  const {
    items: comprobantes,
    isLoading,
    search,
    setSearch,
    page,
    setPage,
    total,
    totalPages,
    pageSize,
    refetch: fetchComprobantes,
  } = usePaginatedList<Comprobante>("/arca/comprobantes", {
    errorMessage: "No se pudieron cargar los comprobantes",
  });

  useEffect(() => {
    fetchComprobantes();
  }, []);

  const columns: ColumnDef<Comprobante>[] = [
    {
      accessorKey: "createdAt",
      header: "Fecha",
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString("es-AR"),
    },
    {
      accessorKey: "tipoComprobante",
      header: "Tipo",
      cell: ({ row }) => formatTipoComprobante(row.original.tipoComprobante),
    },
    {
      id: "numero",
      header: "Numero",
      cell: ({ row }) =>
        formatPuntoVentaNumero(row.original.puntoVenta, row.original.numero),
    },
    {
      id: "cliente",
      header: "Cliente",
      accessorFn: (row) => row.venta?.cliente?.razonSocial ?? "-",
    },
    {
      accessorKey: "cae",
      header: "CAE",
      cell: ({ row }) => row.original.cae ?? "-",
    },
    {
      accessorKey: "importeTotal",
      header: "Importe Total",
      cell: ({ row }) => formatCurrency(row.original.importeTotal),
    },
    {
      accessorKey: "resultado",
      header: "Resultado",
      cell: ({ row }) => {
        const resultado = row.original.resultado;
        if (resultado === "A") {
          return (
            <Badge className="bg-green-600 hover:bg-green-600/80 text-white border-transparent">
              Aprobado
            </Badge>
          );
        }
        if (resultado === "R") {
          return <Badge variant="destructive">Rechazado</Badge>;
        }
        return <Badge variant="outline">{resultado ?? "-"}</Badge>;
      },
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/facturacion/${row.original.id}`)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Facturacion - Comprobantes</h1>
        <RoleGate allowedRoles={[Role.ADMIN]}>
          <Button
            variant="outline"
            onClick={() => router.push("/facturacion/configuracion")}
          >
            <Settings className="mr-2 h-4 w-4" />
            Configuracion ARCA
          </Button>
        </RoleGate>
      </div>

      <PaginatedTable
        columns={columns}
        data={comprobantes}
        isLoading={isLoading}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar comprobantes..."
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
        entityLabel="comprobante"
      />
    </div>
  );
}
