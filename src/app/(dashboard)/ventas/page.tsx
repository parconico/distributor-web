"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { get } from "@/lib/api-client";
import { Venta, PaginatedResponse, EstadoVenta, Role } from "@/types";
import { formatCurrency, formatListaPrecio, formatEstadoVenta, estadoVentaVariant } from "@/lib/formatters";
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
import { Loader2, Plus } from "lucide-react";

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
      cell: ({ row }) => (
        <Badge variant={estadoVentaVariant(row.original.estado)}>
          {formatEstadoVenta(row.original.estado)}
        </Badge>
      ),
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
      <div className="flex items-center gap-4">
        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
          <SelectTrigger className="w-[200px]">
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
      <div
        onClick={(e) => {
          const row = (e.target as HTMLElement).closest("tr[data-state]");
          if (!row) return;
          const rowIndex = row.getAttribute("data-state") === "selected" ? -1 : Array.from(row.parentElement?.children ?? []).indexOf(row);
          if (rowIndex >= 0 && filteredVentas[rowIndex]) {
            router.push(`/ventas/${filteredVentas[rowIndex].id}`);
          }
        }}
      >
        <DataTable
          columns={columns}
          data={filteredVentas}
          searchKey="numero"
          searchPlaceholder="Buscar ventas..."
        />
      </div>
    </div>
  );
}
