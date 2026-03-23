"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { get, del } from "@/lib/api-client";
import { Venta, PaginatedResponse, EstadoVenta, Role } from "@/types";
import { formatCurrency, formatListaPrecio, formatEstadoVenta, estadoVentaVariant, formatMetodoPago } from "@/lib/formatters";
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

export default function VentasPage() {
  const router = useRouter();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [filteredVentas, setFilteredVentas] = useState<Venta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [estadoFilter, setEstadoFilter] = useState<string>("all");

  const fetchVentas = async () => {
    try {
      const response = await get<PaginatedResponse<Venta>>(
        "/ventas?page=1&limit=100"
      );
      setVentas(response.data);
      setFilteredVentas(response.data);
    } catch {
      toast({
        title: "Error",
        description: "No se pudieron cargar las ventas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVentas();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await del(`/ventas/${id}`);
      toast({ title: "Venta eliminada correctamente" });
      fetchVentas();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ?? "No se pudo eliminar la venta",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (estadoFilter === "all") {
      setFilteredVentas(ventas);
    } else {
      setFilteredVentas(ventas.filter((v) => v.estado === estadoFilter));
    }
  }, [estadoFilter, ventas]);

  const columns: ColumnDef<Venta>[] = [
    {
      accessorKey: "numero",
      header: "#",
    },
    {
      accessorKey: "createdAt",
      header: "Fecha",
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString("es-AR"),
    },
    {
      id: "cliente",
      header: "Cliente",
      cell: ({ row }) => row.original.cliente?.razonSocial ?? "-",
    },
    {
      id: "vendedor",
      header: "Vendedor",
      cell: ({ row }) => {
        const v = row.original.vendedor;
        return v ? `${v.firstName} ${v.lastName}` : "-";
      },
    },
    {
      accessorKey: "listaPrecio",
      header: "Lista",
      cell: ({ row }) => formatListaPrecio(row.original.listaPrecio),
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => formatCurrency(row.original.total),
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => {
        const v = row.original;
        if (v.estado === EstadoVenta.BORRADOR) {
          return <Badge variant="outline">Borrador</Badge>;
        }
        if (v.estado === EstadoVenta.ANULADA) {
          return <Badge variant="destructive">Anulada</Badge>;
        }
        return (
          <Badge variant={estadoVentaVariant(v.estado)}>
            {v.pagos.map(p => formatMetodoPago(p.metodoPago)).join(" + ")}
          </Badge>
        );
      },
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => {
        const venta = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/ventas/${venta.id}`)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {venta.estado !== EstadoVenta.FACTURADA && (
              <RoleGate allowedRoles={[Role.ADMIN]}>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Eliminar venta</AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Está seguro de que desea eliminar la venta #{venta.numero}?
                        Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(venta.id)}>
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Ventas</h1>
        <RoleGate allowedRoles={[Role.ADMIN, Role.VENDEDOR]}>
          <Button asChild>
            <Link href="/ventas/nueva">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Venta
            </Link>
          </Button>
        </RoleGate>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.values(EstadoVenta).map((estado) => (
              <SelectItem key={estado} value={estado}>
                {formatEstadoVenta(estado)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DataTable
        columns={columns}
        data={filteredVentas}
        searchKey="numero"
        searchPlaceholder="Buscar ventas..."
      />
    </div>
  );
}
