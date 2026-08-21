"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { del } from "@/lib/api-client";
import { Proveedor, Role } from "@/types";
import { formatCondicionIva } from "@/lib/formatters";
import { formatCuit } from "@/lib/cuit-validator";
import { toast } from "@/hooks/use-toast";
import { PaginatedTable } from "@/components/tables/paginated-table";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import { AxiosError } from "axios";

export default function ProveedoresPage() {
  const {
    items: proveedores,
    isLoading,
    search,
    setSearch,
    page,
    setPage,
    total,
    totalPages,
    pageSize,
    refetch: fetchProveedores,
  } = usePaginatedList<Proveedor>("/proveedores", {
    errorMessage: "No se pudieron cargar los proveedores",
  });

  const handleDelete = async (id: string) => {
    try {
      await del(`/proveedores/${id}`);
      toast({ title: "Proveedor eliminado correctamente" });
      fetchProveedores();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ?? "No se pudo eliminar el proveedor",
        variant: "destructive",
      });
    }
  };

  const columns: ColumnDef<Proveedor>[] = [
    {
      accessorKey: "razonSocial",
      header: "Razón Social",
    },
    {
      accessorKey: "cuit",
      header: "CUIT",
      cell: ({ row }) => formatCuit(row.original.cuit),
    },
    {
      accessorKey: "condicionIva",
      header: "Condición IVA",
      cell: ({ row }) => formatCondicionIva(row.original.condicionIva),
    },
    {
      accessorKey: "telefono",
      header: "Teléfono",
      cell: ({ row }) => row.original.telefono ?? "-",
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => row.original.email ?? "-",
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => {
        const proveedor = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/proveedores/${proveedor.id}`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <RoleGate allowedRoles={[Role.ADMIN]}>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminar proveedor</AlertDialogTitle>
                    <AlertDialogDescription>
                      ¿Está seguro de que desea eliminar a {proveedor.razonSocial}?
                      Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(proveedor.id)}>
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </RoleGate>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Proveedores</h1>
        <RoleGate allowedRoles={[Role.ADMIN]}>
          <Button asChild>
            <Link href="/proveedores/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Proveedor
            </Link>
          </Button>
        </RoleGate>
      </div>
      <PaginatedTable
        columns={columns}
        data={proveedores}
        isLoading={isLoading}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por razón social o CUIT..."
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
        entityLabel="proveedor"
      />
    </div>
  );
}
