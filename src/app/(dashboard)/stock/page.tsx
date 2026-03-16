"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { get } from "@/lib/api-client";
import { Producto, PaginatedResponse } from "@/types";
import { toast } from "@/hooks/use-toast";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, PackagePlus, History } from "lucide-react";

export default function StockPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const response = await get<PaginatedResponse<Producto>>(
          "/stock?page=1&limit=100"
        );
        setProductos(response.data);
      } catch {
        toast({
          title: "Error",
          description: "No se pudo cargar el stock",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStock();
  }, []);

  const columns: ColumnDef<Producto>[] = [
    {
      accessorKey: "codigo",
      header: "Código",
    },
    {
      accessorKey: "nombre",
      header: "Producto",
    },
    {
      accessorKey: "stockActual",
      header: "Stock Actual",
    },
    {
      accessorKey: "stockMinimo",
      header: "Stock Mínimo",
    },
    {
      accessorKey: "unidadMedida",
      header: "Unidad",
    },
    {
      id: "estado",
      header: "Estado",
      cell: ({ row }) => {
        const p = row.original;
        const isBajo = p.stockActual < p.stockMinimo;
        return (
          <Badge variant={isBajo ? "destructive" : "default"}>
            {isBajo ? "Bajo Stock" : "OK"}
          </Badge>
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
        <h1 className="text-2xl font-bold">Stock</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/stock/movimientos">
              <History className="mr-2 h-4 w-4" />
              Movimientos
            </Link>
          </Button>
          <Button asChild>
            <Link href="/stock/ingreso">
              <PackagePlus className="mr-2 h-4 w-4" />
              Ingreso de Stock
            </Link>
          </Button>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={productos}
        searchKey="nombre"
        searchPlaceholder="Buscar por código o nombre..."
      />
    </div>
  );
}
