"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { get } from "@/lib/api-client";
import { Deudor } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import { DataTable } from "@/components/tables/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function CuentasCorrientesPage() {
  const [deudores, setDeudores] = useState<Deudor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDeudores = async () => {
    try {
      const response = await get<Deudor[]>("/cuentas-corrientes/deudores");
      setDeudores(response);
    } catch {
      toast({
        title: "Error",
        description: "No se pudieron cargar las cuentas corrientes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeudores();
  }, []);

  const totalDeuda = deudores.reduce((acc, d) => acc + d.saldo, 0);

  const columns: ColumnDef<Deudor>[] = [
    {
      accessorFn: (row) => row.cliente.razonSocial,
      id: "razonSocial",
      header: "Cliente",
      cell: ({ row }) => (
        <Link
          href={`/cuentas-corrientes/${row.original.cliente.id}`}
          className="text-primary hover:underline font-medium"
        >
          {row.original.cliente.razonSocial}
        </Link>
      ),
    },
    {
      accessorFn: (row) =>
        `${row.cliente.tipoDocumento}: ${row.cliente.numeroDocumento}`,
      id: "documento",
      header: "Documento",
    },
    {
      accessorKey: "saldo",
      header: "Saldo",
      cell: ({ row }) => (
        <span className={row.original.saldo > 0 ? "text-red-600 font-medium" : ""}>
          {formatCurrency(row.original.saldo)}
        </span>
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
        <h1 className="text-2xl font-bold">Cuentas Corrientes — Deudores</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deuda Total</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-red-600">
            {formatCurrency(totalDeuda)}
          </p>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={deudores}
        searchKey="razonSocial"
        searchPlaceholder="Buscar clientes..."
      />
    </div>
  );
}
