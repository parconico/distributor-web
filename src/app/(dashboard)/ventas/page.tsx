"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { get, del } from "@/lib/api-client";
import { Venta, EstadoVenta, Role } from "@/types";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Eye, Loader2, Plus, Trash2 } from "lucide-react";
import { AxiosError } from "axios";
import { downloadFile } from "@/lib/download";

// Formato que espera <input type="date">, armado con la fecha local: toISOString
// devuelve UTC y en Argentina adelantaria un dia a partir de las 21hs.
const isoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

const primerDiaDelMes = () => {
  const hoy = new Date();
  return isoDate(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
};

// El endpoint devuelve el total dentro de "meta", no aplanado como PaginatedResponse.
interface PaginatedVentas {
  data: Venta[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const PAGE_SIZE = 20;

export default function VentasPage() {
  const router = useRouter();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [estadoFilter, setEstadoFilter] = useState<string>("all");

  // Filtro, busqueda y paginado los resuelve la API. Antes la pantalla pedia
  // "?page=1&limit=100" y filtraba en el browser, asi que cualquier venta fuera
  // de las 100 mas recientes era inalcanzable.
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Descarga del detalle
  const [exportOpen, setExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [fechaDesde, setFechaDesde] = useState(primerDiaDelMes);
  const [fechaHasta, setFechaHasta] = useState(() => isoDate(new Date()));

  const fetchVentas = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (estadoFilter !== "all") params.set("estado", estadoFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const response = await get<PaginatedVentas>(
        `/ventas?${params.toString()}`
      );
      setVentas(response.data);
      setTotal(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch {
      toast({
        title: "Error",
        description: "No se pudieron cargar las ventas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, estadoFilter, debouncedSearch]);

  useEffect(() => {
    fetchVentas();
  }, [fetchVentas]);

  // Al tipear volvemos a la primera pagina: el resultado filtrado puede tener
  // menos paginas que el listado completo.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  // Borrar la ultima venta de la ultima pagina nos dejaria fuera de rango.
  useEffect(() => {
    if (!isLoading && totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [isLoading, page, totalPages]);

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

  const handleExportDetalle = async () => {
    if (fechaDesde > fechaHasta) {
      toast({
        title: "Rango inválido",
        description: "La fecha desde no puede ser posterior a la fecha hasta",
        variant: "destructive",
      });
      return;
    }
    setIsExporting(true);
    try {
      await downloadFile(
        `/reportes/ventas/detalle/excel?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`,
        `ventas-detalle-${fechaDesde}-${fechaHasta}.xlsx`
      );
      setExportOpen(false);
    } catch {
      toast({
        title: "Error al descargar",
        description: "No se pudo generar el detalle de ventas",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Ventas</h1>
        <div className="flex flex-wrap gap-2">
          {/* El endpoint de reportes solo lo pueden usar ADMIN y CONTADOR */}
          <RoleGate allowedRoles={[Role.ADMIN, Role.CONTADOR]}>
            <Dialog open={exportOpen} onOpenChange={setExportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Descargar Detalle
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Descargar detalle de ventas</DialogTitle>
                  <DialogDescription>
                    Genera un Excel con dos hojas: una fila por venta con
                    totales y forma de pago, y el detalle de cada producto
                    vendido. Incluye las ventas confirmadas y facturadas del
                    período.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="fecha-desde">Desde</Label>
                      <Input
                        id="fecha-desde"
                        type="date"
                        value={fechaDesde}
                        onChange={(e) => setFechaDesde(e.target.value)}
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="fecha-hasta">Hasta</Label>
                      <Input
                        id="fecha-hasta"
                        type="date"
                        value={fechaHasta}
                        onChange={(e) => setFechaHasta(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setExportOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleExportDetalle} disabled={isExporting}>
                      {isExporting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Descargar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </RoleGate>
          <RoleGate allowedRoles={[Role.ADMIN, Role.VENDEDOR]}>
            <Button asChild>
              <Link href="/ventas/nueva">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Venta
              </Link>
            </Button>
          </RoleGate>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Select
          value={estadoFilter}
          onValueChange={(val) => {
            setEstadoFilter(val);
            setPage(1);
          }}
        >
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
        <Input
          placeholder="Buscar por número o cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable columns={columns} data={ventas} pagination={false} />
      )}

      {!isLoading && total > 0 && (
        <div className="flex flex-col gap-2 px-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {total} venta(s) &middot; mostrando {(page - 1) * PAGE_SIZE + 1}-
            {Math.min(page * PAGE_SIZE, total)}
          </div>
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
        </div>
      )}
    </div>
  );
}
