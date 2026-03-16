"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { get } from "@/lib/api-client";
import { DashboardKpis, EstadoVenta } from "@/types";
import { formatCurrency, formatEstadoVenta, estadoVentaVariant } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Users,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchKpis = async () => {
      try {
        const data = await get<DashboardKpis>("/dashboard/kpis");
        setKpis(data);
      } catch {
        toast({
          title: "Error",
          description: "No se pudieron cargar los indicadores del dashboard",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchKpis();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Bienvenido, {user?.firstName}
        </h1>
        <p className="text-muted-foreground">
          Resumen general del sistema de distribución
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Ventas Hoy */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Hoy</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(kpis?.ventasHoy.total ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {kpis?.ventasHoy.count ?? 0} venta(s)
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Ventas del Mes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(kpis?.ventasMes.total ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {kpis?.ventasMes.count ?? 0} venta(s)
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Deuda Total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deuda Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-7 w-32" />
              </div>
            ) : (
              <div
                className={`text-2xl font-bold ${
                  (kpis?.deudaTotal ?? 0) > 0 ? "text-red-600" : ""
                }`}
              >
                {formatCurrency(kpis?.deudaTotal ?? 0)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Productos Bajo Stock */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Bajo Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-7 w-16" />
              </div>
            ) : (
              <div
                className={`text-2xl font-bold ${
                  (kpis?.productosBajoStock ?? 0) > 0 ? "text-red-600" : ""
                }`}
              >
                {kpis?.productosBajoStock ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Últimas Ventas */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Ventas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kpis?.ultimasVentas && kpis.ultimasVentas.length > 0 ? (
                    kpis.ultimasVentas.map((venta) => (
                      <TableRow key={venta.id}>
                        <TableCell className="font-medium">
                          #{venta.numero}
                        </TableCell>
                        <TableCell>
                          {new Date(venta.createdAt).toLocaleDateString("es-AR")}
                        </TableCell>
                        <TableCell>
                          {venta.cliente?.razonSocial ?? "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(venta.total)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={estadoVentaVariant(venta.estado as EstadoVenta)}>
                            {formatEstadoVenta(venta.estado as EstadoVenta)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Sin ventas recientes.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
