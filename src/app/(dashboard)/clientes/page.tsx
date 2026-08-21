"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { get, del } from "@/lib/api-client";
import { Cliente, Role } from "@/types";
import { formatCondicionIva, formatListaPrecio, formatCurrency } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import { DataTable } from "@/components/tables/data-table";
import { RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// El endpoint devuelve el total dentro de "meta", no aplanado como PaginatedResponse.
interface PaginatedClientes {
  data: Cliente[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const PAGE_SIZE = 20;

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Busqueda y paginado los resuelve la API. Antes la pantalla pedia
  // "?page=1&limit=100" y paginaba en el browser, asi que el cliente 101 en
  // adelante era inalcanzable.
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchClientes = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (debouncedSearch) params.set("search", debouncedSearch);

      const response = await get<PaginatedClientes>(
        `/clientes?${params.toString()}`
      );
      setClientes(response.data);
      setTotal(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch {
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  // Al tipear volvemos a la primera pagina: el filtrado puede tener menos
  // paginas que el listado completo.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  // Borrar el ultimo cliente de la ultima pagina nos dejaria fuera de rango.
  useEffect(() => {
    if (!isLoading && totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [isLoading, page, totalPages]);

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
      <Input
        placeholder="Buscar por nombre o documento..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full sm:max-w-sm"
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable columns={columns} data={clientes} pagination={false} />
      )}

      {!isLoading && total > 0 && (
        <div className="flex flex-col gap-2 px-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {total} cliente(s) &middot; mostrando {(page - 1) * PAGE_SIZE + 1}-
            {Math.min(page * PAGE_SIZE, total)}
          </div>
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
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
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
