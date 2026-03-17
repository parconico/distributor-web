"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { get, post } from "@/lib/api-client";
import { Cliente, MetodoPago, MovimientoCuentaCorriente, PaginatedResponse, TipoMovimientoCuenta } from "@/types";
import { formatCurrency, formatMetodoPago, formatTipoMovimientoCuenta } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { AxiosError } from "axios";

export default function CuentaCorrienteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clienteId = params.clienteId as string;

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoCuentaCorriente[]>([]);
  const [saldo, setSaldo] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Pago dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pagoMonto, setPagoMonto] = useState<number>(0);
  const [pagoMetodoPago, setPagoMetodoPago] = useState<MetodoPago>(MetodoPago.EFECTIVO);
  const [pagoDescripcion, setPagoDescripcion] = useState("Pago recibido");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [clienteData, movimientosData, saldoData] = await Promise.all([
        get<Cliente>(`/clientes/${clienteId}`),
        get<PaginatedResponse<MovimientoCuentaCorriente>>(`/cuentas-corrientes/${clienteId}?limit=1000`),
        get<{ saldo: number }>(`/cuentas-corrientes/${clienteId}/saldo`),
      ]);
      setCliente(clienteData);
      setMovimientos(movimientosData.data);
      setSaldo(saldoData.saldo);
    } catch {
      toast({
        title: "Error",
        description: "No se pudo cargar la cuenta corriente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [clienteId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRegistrarPago = async () => {
    if (pagoMonto <= 0) {
      toast({
        title: "Error",
        description: "El monto debe ser mayor a 0",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await post("/cuentas-corrientes/pago", {
        clienteId,
        monto: pagoMonto,
        metodoPago: pagoMetodoPago,
        descripcion: pagoDescripcion || "Pago recibido",
      });
      toast({ title: "Pago registrado correctamente" });
      setDialogOpen(false);
      setPagoMonto(0);
      setPagoMetodoPago(MetodoPago.EFECTIVO);
      setPagoDescripcion("Pago recibido");
      await fetchData();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ?? "No se pudo registrar el pago",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: ColumnDef<MovimientoCuentaCorriente>[] = [
    {
      accessorKey: "fecha",
      header: "Fecha",
      cell: ({ row }) =>
        new Date(row.original.fecha).toLocaleDateString("es-AR"),
    },
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }) => {
        const tipo = row.original.tipo;
        return (
          <Badge
            variant={tipo === TipoMovimientoCuenta.DEBITO ? "destructive" : "default"}
            className={
              tipo === TipoMovimientoCuenta.CREDITO
                ? "bg-green-600 hover:bg-green-600/80"
                : ""
            }
          >
            {formatTipoMovimientoCuenta(tipo)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "monto",
      header: "Monto",
      cell: ({ row }) => formatCurrency(row.original.monto),
    },
    {
      accessorKey: "saldo",
      header: "Saldo",
      cell: ({ row }) => formatCurrency(row.original.saldo),
    },
    {
      accessorKey: "metodoPago",
      header: "Método de Pago",
      cell: ({ row }) => {
        const metodo = row.original.metodoPago;
        return metodo ? formatMetodoPago(metodo) : "—";
      },
    },
    {
      accessorKey: "descripcion",
      header: "Descripción",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Cliente no encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Cuenta Corriente — {cliente.razonSocial}
        </h1>
        <div className="flex items-center gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>Registrar Pago</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Pago</DialogTitle>
                <DialogDescription>
                  Registrar un pago para {cliente.razonSocial}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="monto">Monto</Label>
                  <Input
                    id="monto"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={pagoMonto || ""}
                    onChange={(e) => setPagoMonto(Number(e.target.value))}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metodoPago">Método de Pago</Label>
                  <Select
                    value={pagoMetodoPago}
                    onValueChange={(value) => setPagoMetodoPago(value as MetodoPago)}
                  >
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
                  <Label htmlFor="descripcion">Descripción (opcional)</Label>
                  <Input
                    id="descripcion"
                    value={pagoDescripcion}
                    onChange={(e) => setPagoDescripcion(e.target.value)}
                    placeholder="Pago recibido"
                  />
                </div>
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
                  onClick={handleRegistrarPago}
                  disabled={isSubmitting || pagoMonto <= 0}
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Registrar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => router.push("/cuentas-corrientes")}>
            Volver
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saldo Actual</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-3xl font-bold ${saldo > 0 ? "text-red-600" : "text-green-600"}`}>
            {formatCurrency(saldo)}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Movimientos</h2>
        <DataTable
          columns={columns}
          data={movimientos}
          searchKey="descripcion"
          searchPlaceholder="Buscar movimientos..."
        />
      </div>
    </div>
  );
}
