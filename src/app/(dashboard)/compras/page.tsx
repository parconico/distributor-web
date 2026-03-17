"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { get, del } from "@/lib/api-client";
import { Compra, PaginatedResponse, EstadoCompra, Role } from "@/types";
import { formatCurrency, formatEstadoCompra, estadoCompraVariant } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import { DataTable } from "@/components/tables/data-table";
import { RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Eye, Loader2, Plus, Trash2 } from "lucide-react";
import { AxiosError } from "axios";

export default function ComprasPage() {
  const router = useRouter();
  const [compras, setCompras] = useState<Compra[]>([]);
  const [filteredCompras, setFilteredCompras] = useState<Compra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [estadoFilter, setEstadoFilter] = useState<string>("all");

  const fetchCompras = async () => {
    try {
      const response = await get<PaginatedResponse<Compra>>(
        "/compras?page=1&limit=100"
      );
      setCompras(response.data);
      setFilteredCompras(response.data);
    } catch {
      toast({
        title: "Error",
        description: "No se pudieron cargar las compras",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompras();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await del(`/compras/${id}`);
      toast({ title: "Compra eliminada correctamente" });
      fetchCompras();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ?? "No se pudo eliminar la compra",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (estadoFilter === "all") {
      setFilteredCompras(compras);
    } else {
      setFilteredCompras(compras.filter((c) => c.estado === estadoFilter));
    }
  }, [estadoFilter, compras]);

  const columns: ColumnDef<Compra>[] = [
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
      id: "proveedor",
      header: "Proveedor",
      cell: ({ row }) => row.original.proveedor?.razonSocial ?? "-",
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
        <Badge variant={estadoCompraVariant(row.original.estado)}>
          {formatEstadoCompra(row.original.estado)}
        </Badge>
      ),
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => {
        const compra = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/compras/${compra.id}`)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {compra.estado === EstadoCompra.BORRADOR && (
              <RoleGate allowedRoles={[Role.ADMIN, Role.DEPOSITO]}>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Eliminar compra</AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Está seguro de que desea eliminar la compra #{compra.numero}?
                        Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(compra.id)}>
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </RoleGate>
            )}
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Compras</h1>
        <RoleGate allowedRoles={[Role.ADMIN, Role.DEPOSITO]}>
          <Button asChild>
            <Link href="/compras/nueva">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Compra
            </Link>
          </Button>
        </RoleGate>
      </div>
      <div className="flex items-center gap-4">
        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.values(EstadoCompra).map((estado) => (
              <SelectItem key={estado} value={estado}>
                {formatEstadoCompra(estado)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DataTable
        columns={columns}
        data={filteredCompras}
        searchKey="numero"
        searchPlaceholder="Buscar compras..."
      />
    </div>
  );
}
