"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { get, post, patch, del } from "@/lib/api-client";
import { Cliente, MetodoPago, MovimientoCuentaCorriente, PaginatedResponse, Role, TipoMovimientoCuenta } from "@/types";
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
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { AxiosError } from "axios";
import { RoleGate } from "@/components/shared/role-gate";
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

  // Saldo a favor dialog state
  const [saldoFavorOpen, setSaldoFavorOpen] = useState(false);
  const [saldoFavorMonto, setSaldoFavorMonto] = useState<number>(0);
  const [saldoFavorMetodoPago, setSaldoFavorMetodoPago] = useState<MetodoPago>(MetodoPago.EFECTIVO);
  const [saldoFavorDescripcion, setSaldoFavorDescripcion] = useState("Saldo a favor");
  const [isSubmittingSaldo, setIsSubmittingSaldo] = useState(false);

  // Devolución dialog state
  const [devolucionOpen, setDevolucionOpen] = useState(false);
  const [devolucionMonto, setDevolucionMonto] = useState<number>(0);
  const [devolucionMetodoPago, setDevolucionMetodoPago] = useState<MetodoPago>(MetodoPago.EFECTIVO);
  const [devolucionDescripcion, setDevolucionDescripcion] = useState("Devolución de saldo a favor");
  const [isSubmittingDevolucion, setIsSubmittingDevolucion] = useState(false);

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

  const handleCargarSaldoFavor = async () => {
    if (saldoFavorMonto <= 0) {
      toast({
        title: "Error",
        description: "El monto debe ser mayor a 0",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmittingSaldo(true);
      await post("/cuentas-corrientes/pago", {
        clienteId,
        monto: saldoFavorMonto,
        metodoPago: saldoFavorMetodoPago,
        descripcion: saldoFavorDescripcion || "Saldo a favor",
      });
      toast({ title: "Saldo a favor cargado correctamente" });
      setSaldoFavorOpen(false);
      setSaldoFavorMonto(0);
      setSaldoFavorMetodoPago(MetodoPago.EFECTIVO);
      setSaldoFavorDescripcion("Saldo a favor");
      await fetchData();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ?? "No se pudo cargar el saldo a favor",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingSaldo(false);
    }
  };

  // Edit movimiento state
  const [editMovimiento, setEditMovimiento] = useState<MovimientoCuentaCorriente | null>(null);
  const [editMonto, setEditMonto] = useState<number>(0);
  const [editMetodoPago, setEditMetodoPago] = useState<MetodoPago | "">(MetodoPago.EFECTIVO);
  const [editDescripcion, setEditDescripcion] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const openEdit = (m: MovimientoCuentaCorriente) => {
    setEditMovimiento(m);
    setEditMonto(m.monto);
    setEditMetodoPago(m.metodoPago ?? "");
    setEditDescripcion(m.descripcion);
  };

  const handleEdit = async () => {
    if (!editMovimiento || editMonto <= 0) return;
    try {
      setIsSubmittingEdit(true);
      await patch(`/cuentas-corrientes/movimientos/${editMovimiento.id}`, {
        monto: editMonto,
        descripcion: editDescripcion,
        ...(editMetodoPago ? { metodoPago: editMetodoPago } : { metodoPago: null }),
      });
      toast({ title: "Movimiento actualizado" });
      setEditMovimiento(null);
      await fetchData();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description: axiosError.response?.data?.message ?? "No se pudo actualizar",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await del(`/cuentas-corrientes/movimientos/${id}`);
      toast({ title: "Movimiento eliminado" });
      await fetchData();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description: axiosError.response?.data?.message ?? "No se pudo eliminar",
        variant: "destructive",
      });
    }
  };

  const handleDevolucion = async () => {
    if (devolucionMonto <= 0) {
      toast({ title: "Error", description: "El monto debe ser mayor a 0", variant: "destructive" });
      return;
    }
    try {
      setIsSubmittingDevolucion(true);
      await post("/cuentas-corrientes/devolucion", {
        clienteId,
        monto: devolucionMonto,
        metodoPago: devolucionMetodoPago,
        descripcion: devolucionDescripcion || "Devolución de saldo a favor",
      });
      toast({ title: "Devolución registrada correctamente" });
      setDevolucionOpen(false);
      setDevolucionMonto(0);
      setDevolucionDescripcion("Devolución de saldo a favor");
      await fetchData();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description: axiosError.response?.data?.message ?? "No se pudo registrar la devolución",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingDevolucion(false);
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
    {
      id: "acciones",
      header: "",
      cell: ({ row }) => {
        const m = row.original;
        return (
          <RoleGate allowedRoles={[Role.ADMIN]}>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => openEdit(m)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminar movimiento</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se eliminará el movimiento y se recalcularán los saldos. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(m.id)}>
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </RoleGate>
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

  if (!cliente) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Cliente no encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">
          Cuenta Corriente — {cliente.razonSocial}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
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
          <Dialog open={saldoFavorOpen} onOpenChange={setSaldoFavorOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Cargar Saldo a Favor</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cargar Saldo a Favor</DialogTitle>
                <DialogDescription>
                  Asignar un saldo a favor para {cliente.razonSocial}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="saldo-favor-monto">Monto</Label>
                  <Input
                    id="saldo-favor-monto"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={saldoFavorMonto || ""}
                    onChange={(e) => setSaldoFavorMonto(Number(e.target.value))}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Método de Pago</Label>
                  <Select
                    value={saldoFavorMetodoPago}
                    onValueChange={(value) => setSaldoFavorMetodoPago(value as MetodoPago)}
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
                  <Label htmlFor="saldo-favor-descripcion">Descripción (opcional)</Label>
                  <Input
                    id="saldo-favor-descripcion"
                    value={saldoFavorDescripcion}
                    onChange={(e) => setSaldoFavorDescripcion(e.target.value)}
                    placeholder="Saldo a favor"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSaldoFavorOpen(false)}
                  disabled={isSubmittingSaldo}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCargarSaldoFavor}
                  disabled={isSubmittingSaldo || saldoFavorMonto <= 0}
                >
                  {isSubmittingSaldo && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Cargar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {saldo < 0 && (
            <Dialog open={devolucionOpen} onOpenChange={setDevolucionOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Devolver Saldo</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Devolver Saldo a Favor</DialogTitle>
                  <DialogDescription>
                    Saldo disponible: {formatCurrency(Math.abs(saldo))}. Registrá la devolución entregada a {cliente.razonSocial}.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Monto a devolver</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={devolucionMonto || ""}
                      onChange={(e) => setDevolucionMonto(Number(e.target.value))}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Método de pago</Label>
                    <Select
                      value={devolucionMetodoPago}
                      onValueChange={(v) => setDevolucionMetodoPago(v as MetodoPago)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={MetodoPago.EFECTIVO}>Efectivo</SelectItem>
                        <SelectItem value={MetodoPago.TRANSFERENCIA}>Transferencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción (opcional)</Label>
                    <Input
                      value={devolucionDescripcion}
                      onChange={(e) => setDevolucionDescripcion(e.target.value)}
                      placeholder="Devolución de saldo a favor"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDevolucionOpen(false)} disabled={isSubmittingDevolucion}>
                    Cancelar
                  </Button>
                  <Button onClick={handleDevolucion} disabled={isSubmittingDevolucion || devolucionMonto <= 0}>
                    {isSubmittingDevolucion && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirmar devolución
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline" onClick={() => router.push("/cuentas-corrientes")}>
            Volver
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {saldo > 0 ? "Deuda" : saldo < 0 ? "Saldo a Favor" : "Saldo"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${
              saldo > 0
                ? "text-red-600"
                : saldo < 0
                  ? "text-green-600"
                  : ""
            }`}>
              {saldo < 0 ? formatCurrency(Math.abs(saldo)) : formatCurrency(saldo)}
            </p>
            {saldo < 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                El cliente tiene crédito disponible
              </p>
            )}
            {saldo > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                El cliente tiene deuda pendiente
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Movimientos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{movimientos.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Total de movimientos registrados
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Movimientos</h2>
        <DataTable
          columns={columns}
          data={movimientos}
          searchKey="descripcion"
          searchPlaceholder="Buscar movimientos..."
        />
      </div>

      {/* Edit dialog — controlled outside the table */}
      <Dialog open={!!editMovimiento} onOpenChange={(open) => { if (!open) setEditMovimiento(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar movimiento</DialogTitle>
            <DialogDescription>
              Modificá los datos del movimiento. Los saldos se recalcularán automáticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Monto</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={editMonto || ""}
                onChange={(e) => setEditMonto(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Método de pago (opcional)</Label>
              <Select
                value={editMetodoPago}
                onValueChange={(v) => setEditMetodoPago(v as MetodoPago)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin método</SelectItem>
                  <SelectItem value={MetodoPago.EFECTIVO}>Efectivo</SelectItem>
                  <SelectItem value={MetodoPago.TRANSFERENCIA}>Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input
                value={editDescripcion}
                onChange={(e) => setEditDescripcion(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMovimiento(null)} disabled={isSubmittingEdit}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={isSubmittingEdit || editMonto <= 0}>
              {isSubmittingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
