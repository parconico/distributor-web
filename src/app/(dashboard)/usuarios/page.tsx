"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { get, del, patch } from "@/lib/api-client";
import { Role, User } from "@/types";
import { formatRole } from "@/lib/roles";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { DataTable } from "@/components/tables/data-table";
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
import { Loader2, Pencil, Plus, UserMinus, UserCheck } from "lucide-react";
import { AxiosError } from "axios";

interface PaginatedUsers {
  data: User[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const PAGE_SIZE = 20;

export default function UsuariosPage() {
  const { user: actual } = useAuth();
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsuarios = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await get<PaginatedUsers>(
        `/users?page=${page}&limit=${PAGE_SIZE}`
      );
      setUsuarios(response.data);
      setTotal(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch {
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const desactivar = async (usuario: User) => {
    try {
      await del(`/users/${usuario.id}`);
      toast({ title: `${usuario.firstName} ya no puede entrar al sistema` });
      fetchUsuarios();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ?? "No se pudo desactivar",
        variant: "destructive",
      });
    }
  };

  const reactivar = async (usuario: User) => {
    try {
      await patch(`/users/${usuario.id}`, { isActive: true });
      toast({ title: `${usuario.firstName} vuelve a tener acceso` });
      fetchUsuarios();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ?? "No se pudo reactivar",
        variant: "destructive",
      });
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      id: "nombre",
      header: "Nombre",
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {u.firstName} {u.lastName}
            </span>
            {u.id === actual?.id && (
              <Badge variant="outline" className="text-xs">
                Vos
              </Badge>
            )}
          </div>
        );
      },
    },
    { accessorKey: "email", header: "Email" },
    {
      accessorKey: "role",
      header: "Rol",
      cell: ({ row }) => formatRole(row.original.role),
    },
    {
      accessorKey: "isActive",
      header: "Estado",
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge className="border-transparent bg-green-600 text-white hover:bg-green-600/80">
            Activo
          </Badge>
        ) : (
          <Badge variant="secondary">Sin acceso</Badge>
        ),
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => {
        const usuario = row.original;
        // Nadie se saca el acceso a si mismo: dejaria el sistema sin quien
        // administre si es el unico ADMIN.
        const esUnoMismo = usuario.id === actual?.id;

        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/usuarios/${usuario.id}`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>

            {usuario.isActive ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={esUnoMismo}>
                    <UserMinus className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Quitar el acceso</AlertDialogTitle>
                    <AlertDialogDescription>
                      {usuario.firstName} {usuario.lastName} no va a poder
                      entrar más al sistema. Las ventas y los movimientos que
                      cargó quedan como están, y el acceso se puede devolver
                      cuando quieras.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => desactivar(usuario)}>
                      Quitar acceso
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => reactivar(usuario)}
                title="Devolver el acceso"
              >
                <UserCheck className="h-4 w-4 text-green-600" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Quién entra al sistema y qué puede hacer.
          </p>
        </div>
        <Button asChild>
          <Link href="/usuarios/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable columns={columns} data={usuarios} pagination={false} />
      )}

      {!isLoading && total > 0 && (
        <div className="flex flex-col gap-2 px-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {total} usuario(s)
          </div>
          {totalPages > 1 && (
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
          )}
        </div>
      )}
    </div>
  );
}
