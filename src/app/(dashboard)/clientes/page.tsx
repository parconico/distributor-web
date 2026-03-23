"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { get, del } from "@/lib/api-client";
import { Cliente, PaginatedResponse, Role } from "@/types";
import { formatCondicionIva, formatListaPrecio, formatCurrency } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import { DataTable } from "@/components/tables/data-table";
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
import { Loader2, Pencil, Trash2, Plus } from "lucide-react";
import { AxiosError } from "axios";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClientes = async () => {
    try {
      const response = await get<PaginatedResponse<Cliente>>(
        "/clientes?page=1&limit=100"
      );
      setClientes(response.data);
    } catch {
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await del(`/clientes/${id}`);
      toast({ title: "Cliente eliminado correctamente" });
      fetchClientes();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ?? "No se pudo eliminar el cliente",
        variant: "destructive",
      });
    }
  };

  const columns: ColumnDef<Cliente>[] = [
    {
      accessorKey: "razonSocial",
      header: "Razón Social",
    },
    {
      id: "documento",
      header: "Documento",
      cell: ({ row }) =>
        `${row.original.tipoDocumento} ${row.original.numeroDocumento}`,
    },
    {
      accessorKey: "condicionIva",
      header: "Condición IVA",
      cell: ({ row }) => formatCondicionIva(row.original.condicionIva),
    },
    {
      accessorKey: "listaPrecio",
      header: "Lista Precio",
      cell: ({ row }) => formatListaPrecio(row.original.listaPrecio),
    },
    {
      accessorKey: "limiteCredito",
      header: "Límite Crédito",
      cell: ({ row }) => formatCurrency(row.original.limiteCredito),
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => {
        const cliente = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/clientes/${cliente.id}`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <RoleGate allowedRoles={[Role.ADMIN, Role.VENDEDOR]}>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminar cliente</AlertDialogTitle>
                    <AlertDialogDescription>
                      ¿Está seguro de que desea eliminar a {cliente.razonSocial}?
                      Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(cliente.id)}>
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <RoleGate allowedRoles={[Role.ADMIN, Role.VENDEDOR]}>
          <Button asChild>
            <Link href="/clientes/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Link>
          </Button>
        </RoleGate>
      </div>
      <DataTable
        columns={columns}
        data={clientes}
        searchKey="razonSocial"
        searchPlaceholder="Buscar clientes..."
      />
    </div>
  );
}
