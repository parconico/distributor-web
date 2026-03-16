"use client";

import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { get } from "@/lib/api-client";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import { DataTable } from "@/components/tables/data-table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface StockValorizadoRow {
  codigo: string;
  nombre: string;
  stockActual: number;
  precioUnitario: number;
  valorizado: number;
}

interface StockValorizadoData {
  items: StockValorizadoRow[];
  totalValorizado: number;
}

export default function StockValorizadoPage() {
  const [data, setData] = useState<StockValorizadoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await get<StockValorizadoData>(
          "/reportes/stock-valorizado"
        );
        setData(result);
      } catch {
        toast({
          title: "Error",
          description: "No se pudo cargar el reporte de stock valorizado",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const columns: ColumnDef<StockValorizadoRow>[] = [
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
      accessorKey: "precioUnitario",
      header: "Precio Unitario (Lista 1)",
      cell: ({ row }) => formatCurrency(row.original.precioUnitario),
    },
    {
      accessorKey: "valorizado",
      header: "Valorizado",
      cell: ({ row }) => formatCurrency(row.original.valorizado),
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Stock Valorizado</h1>

      {data && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Valorizado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(data.totalValorizado)}
              </div>
            </CardContent>
          </Card>

          <DataTable
            columns={columns}
            data={data.items}
            searchKey="nombre"
            searchPlaceholder="Buscar producto..."
          />
        </>
      )}
    </div>
  );
}
