"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { get, del } from "@/lib/api-client";
import { Producto, PaginatedResponse, Role } from "@/types";
import { toast } from "@/hooks/use-toast";
import { DataTable } from "@/components/tables/data-table";
import { RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Loader2, Pencil, Trash2, Plus, FolderTree } from "lucide-react";
import { AxiosError } from "axios";

const UNIDAD_MEDIDA_LABELS: Record<string, string> = {
  UNIDAD: "Unidad",
  KILOGRAMO: "Kilogramo",
  LITRO: "Litro",
  METRO: "Metro",
  CAJA: "Caja",
  PACK: "Pack",
};

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProductos = async () => {
    try {
      const response = await get<PaginatedResponse<Producto>>(
        "/productos?page=1&limit=100"
      );
      setProductos(response.data);
    } catch {
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await del(`/productos/${id}`);
      toast({ title: "Producto eliminado correctamente" });
      fetchProductos();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ?? "No se pudo eliminar el producto",
        variant: "destructive",
      });
    }
  };

  const columns: ColumnDef<Producto>[] = [
    {
      accessorKey: "codigo",
      header: "Código",
    },
    {
      accessorKey: "nombre",
      header: "Nombre",
    },
    {
      id: "subfamilia",
      header: "Subfamilia",
      cell: ({ row }) => {
        const sub = row.original.subfamilia;
        if (!sub) return "-";
        return sub.familia
          ? `${sub.familia.nombre} > ${sub.nombre}`
          : sub.nombre;
      },
    },
    {
      id: "proveedor",
      header: "Proveedor",
      cell: ({ row }) => row.original.proveedor?.razonSocial ?? "-",
    },
    {
      id: "unidadMedida",
      header: "Unidad",
      cell: ({ row }) =>
        UNIDAD_MEDIDA_LABELS[row.original.unidadMedida] ?? row.original.unidadMedida,
    },
    {
      id: "stockActual",
      header: "Stock Actual",
      cell: ({ row }) => {
        const producto = row.original;
        return (
          <div className="flex items-center gap-2">
            <span>{producto.stockActual}</span>
            {producto.stockActual < producto.stockMinimo && (
              <Badge variant="destructive">Bajo stock</Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "alicuotaIva",
      header: "Alícuota IVA (%)",
      cell: ({ row }) => `${row.original.alicuotaIva}%`,
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => {
        const producto = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/productos/${producto.id}`}>
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
                    <AlertDialogTitle>Eliminar producto</AlertDialogTitle>
                    <AlertDialogDescription>
                      ¿Está seguro de que desea eliminar {producto.nombre}?
                      Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(producto.id)}>
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Productos</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/productos/familias">
              <FolderTree className="mr-2 h-4 w-4" />
              Familias
            </Link>
          </Button>
          <RoleGate allowedRoles={[Role.ADMIN]}>
            <Button asChild>
              <Link href="/productos/nuevo">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Producto
              </Link>
            </Button>
          </RoleGate>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={productos}
        searchKey="nombre"
        searchPlaceholder="Buscar productos..."
      />
    </div>
  );
}
