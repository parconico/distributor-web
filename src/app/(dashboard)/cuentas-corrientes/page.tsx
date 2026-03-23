"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { get, post } from "@/lib/api-client";
import { Cliente, Deudor, MetodoPago, PaginatedResponse } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import { DataTable } from "@/components/tables/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { AxiosError } from "axios";

export default function CuentasCorrientesPage() {
  const router = useRouter();
  const [deudores, setDeudores] = useState<Deudor[]>([]);
  const [saldosFavor, setSaldosFavor] = useState<Deudor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Agregar cliente dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedClienteId, setSelectedClienteId] = useState("");
  const [saldoInicial, setSaldoInicial] = useState<number>(0);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>(MetodoPago.EFECTIVO);
  const [descripcion, setDescripcion] = useState("Saldo a favor inicial");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [deudoresData, saldosFavorData] = await Promise.all([
        get<Deudor[]>("/cuentas-corrientes/deudores"),
        get<Deudor[]>("/cuentas-corrientes/saldos-favor"),
      ]);
      setDeudores(deudoresData);
      setSaldosFavor(saldosFavorData);
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

  const fetchClientes = async () => {
    try {
      const response = await get<PaginatedResponse<Cliente>>(
        "/clientes?page=1&limit=500"
      );
      setClientes(response.data);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // IDs of clients already in deudores or saldos a favor
  const clientesConCuenta = new Set([
    ...deudores.map((d) => d.cliente.id),
    ...saldosFavor.map((d) => d.cliente.id),
  ]);

  const handleOpenDialog = () => {
    setSelectedClienteId("");
    setSaldoInicial(0);
    setMetodoPago(MetodoPago.EFECTIVO);
    setDescripcion("Saldo a favor inicial");
    fetchClientes();
    setDialogOpen(true);
  };

  const handleAgregarCliente = async () => {
    if (!selectedClienteId) return;

    try {
      setIsSubmitting(true);

      if (saldoInicial > 0) {
        await post("/cuentas-corrientes/pago", {
          clienteId: selectedClienteId,
          monto: saldoInicial,
          metodoPago,
          descripcion: descripcion || "Saldo a favor inicial",
        });
        toast({ title: "Cliente agregado con saldo a favor" });
      } else {
        toast({ title: "Cliente agregado a cuentas corrientes" });
      }

      setDialogOpen(false);
      router.push(`/cuentas-corrientes/${selectedClienteId}`);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ?? "No se pudo agregar el cliente",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalDeuda = deudores.reduce((acc, d) => acc + d.saldo, 0);
  const totalSaldoFavor = saldosFavor.reduce((acc, d) => acc + Math.abs(d.saldo), 0);

  const deudoresColumns: ColumnDef<Deudor>[] = [
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
      header: "Deuda",
      cell: ({ row }) => (
        <span className="text-red-600 font-medium">
          {formatCurrency(row.original.saldo)}
        </span>
      ),
    },
  ];

  const saldosFavorColumns: ColumnDef<Deudor>[] = [
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
      header: "Saldo a Favor",
      cell: ({ row }) => (
        <span className="text-green-600 font-medium">
          {formatCurrency(Math.abs(row.original.saldo))}
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Cuentas Corrientes</h1>
        <Button onClick={handleOpenDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Cliente
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Deuda Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">
              {formatCurrency(totalDeuda)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {deudores.length} cliente(s)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Saldos a Favor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(totalSaldoFavor)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {saldosFavor.length} cliente(s)
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="deudores">
        <TabsList>
          <TabsTrigger value="deudores">
            Deudores ({deudores.length})
          </TabsTrigger>
          <TabsTrigger value="saldos-favor">
            Saldos a Favor ({saldosFavor.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="deudores" className="mt-4">
          <DataTable
            columns={deudoresColumns}
            data={deudores}
            searchKey="razonSocial"
            searchPlaceholder="Buscar clientes..."
          />
        </TabsContent>
        <TabsContent value="saldos-favor" className="mt-4">
          <DataTable
            columns={saldosFavorColumns}
            data={saldosFavor}
            searchKey="razonSocial"
            searchPlaceholder="Buscar clientes..."
          />
        </TabsContent>
      </Tabs>

      {/* Agregar Cliente Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Cliente a Cuenta Corriente</DialogTitle>
            <DialogDescription>
              Seleccione un cliente y opcionalmente asígnele un saldo a favor
              inicial.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={selectedClienteId} onValueChange={setSelectedClienteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clientes
                    .filter((c) => !clientesConCuenta.has(c.id))
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.razonSocial}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="saldo-inicial">Saldo a Favor Inicial (opcional)</Label>
              <Input
                id="saldo-inicial"
                type="number"
                min="0"
                step="0.01"
                value={saldoInicial || ""}
                onChange={(e) => setSaldoInicial(Number(e.target.value))}
                placeholder="0.00"
              />
            </div>
            {saldoInicial > 0 && (
              <>
              <div className="space-y-2">
                <Label>Método de Pago</Label>
                <Select value={metodoPago} onValueChange={(v) => setMetodoPago(v as MetodoPago)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={MetodoPago.EFECTIVO}>Efectivo</SelectItem>
                    <SelectItem value={MetodoPago.TRANSFERENCIA}>Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion-inicial">Descripción</Label>
                <Input
                  id="descripcion-inicial"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Saldo a favor inicial"
                />
              </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAgregarCliente}
              disabled={!selectedClienteId || isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
