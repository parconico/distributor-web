"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { get } from "@/lib/api-client";
import { Remito, PaginatedResponse, EstadoRemito } from "@/types";
import { formatEstadoRemito, estadoRemitoVariant } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import { DataTable } from "@/components/tables/data-table";
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
  const [remitos, setRemitos] = useState<Remito[]>([]);
  const [filteredRemitos, setFilteredRemitos] = useState<Remito[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [estadoFilter, setEstadoFilter] = useState<string>("all");

  const fetchRemitos = async () => {
    try {
      const response = await get<PaginatedResponse<Remito>>(
        "/remitos?page=1&limit=100"
      );
      setRemitos(response.data);
      setFilteredRemitos(response.data);
    } catch {
      toast({
        title: "Error",
        description: "No se pudieron cargar los remitos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRemitos();
  }, []);

  useEffect(() => {
    if (estadoFilter === "all") {
      setFilteredRemitos(remitos);
    } else {
      setFilteredRemitos(remitos.filter((r) => r.estado === estadoFilter));
    }
  }, [estadoFilter, remitos]);

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
        <h1 className="text-2xl font-bold">Remitos</h1>
        <Button asChild>
          <Link href="/remitos/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Remito
          </Link>
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
          <SelectTrigger className="w-[200px]">
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
      </div>
      <DataTable
        columns={columns}
        data={filteredRemitos}
        searchKey="numero"
        searchPlaceholder="Buscar remitos..."
      />
    </div>
  );
}
